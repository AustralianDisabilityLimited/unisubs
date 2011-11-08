# Universal Subtitles, universalsubtitles.org
# 
# Copyright (C) 2010 Participatory Culture Foundation
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
# 
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see 
# http://www.gnu.org/licenses/agpl-3.0.html.

from django.db import models
from django.utils.translation import ugettext_lazy as _, ugettext
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes import generic
from django.core.exceptions import ValidationError
from videos.models import Video, SubtitleLanguage
from auth.models import CustomUser as User
from utils.amazon import S3EnabledImageField
from django.db.models.signals import post_save, post_delete
from messages.models import Message
from django.template.loader import render_to_string
from django.conf import settings
from django.http import Http404
from django.contrib.sites.models import Site
from teams.tasks import update_one_team_video
from utils.panslugify import pan_slugify
from haystack.query import SQ
from haystack import site
from utils.translation import SUPPORTED_LANGUAGES_DICT
from utils import get_object_or_none
import datetime 

ALL_LANGUAGES = [(val, _(name))for val, name in settings.ALL_LANGUAGES]

from apps.teams.moderation_const import WAITING_MODERATION
from teams.permissions_const import TEAM_PERMISSIONS, PROJECT_PERMISSIONS, \
      LANG_PERMISSIONS, ROLE_ADMIN, ROLE_OWNER, ROLE_CONTRIBUTOR, ROLE_MANAGER

def get_perm_names(model, perms):
    return [("%s-%s-%s" % (model._meta.app_label, model._meta.object_name, p[0]), p[1],) for p in perms]
    

class TeamManager(models.Manager):
    
    def for_user(self, user):
        if user.is_authenticated():
            return self.get_query_set().filter(models.Q(is_visible=True)| \
                                        models.Q(members__user=user)).distinct()
        else:
            return self.get_query_set().filter(is_visible=True)


class Team(models.Model):
    APPLICATION = 1
    INVITATION_BY_MANAGER = 2
    INVITATION_BY_ALL = 3
    OPEN = 4
    MEMBERSHIP_POLICY_CHOICES = (
        (APPLICATION, _(u'Application')),
        (INVITATION_BY_MANAGER, _(u'Invitation by manager')),
        (INVITATION_BY_ALL, _(u'Invitation by any member')),
        (OPEN, _(u'Open')),
    )
    MEMBER_REMOVE = 1
    MANAGER_REMOVE = 2
    MEMBER_ADD = 3
    VIDEO_POLICY_CHOICES = (
        (MEMBER_REMOVE, _(u'Members can add and remove video')),  #any member can add/delete video
        (MANAGER_REMOVE, _(u'Managers can add and remove video')),    #only managers can add/remove video
        (MEMBER_ADD, _(u'Members can only add videos'))  #members can only add video
    )
    
    name = models.CharField(_(u'name'), max_length=250, unique=True)
    slug = models.SlugField(_(u'slug'), unique=True)
    description = models.TextField(_(u'description'), blank=True, help_text=_('All urls will be converted to links.'))
    
    logo = S3EnabledImageField(verbose_name=_(u'logo'), blank=True, upload_to='teams/logo/')
    membership_policy = models.IntegerField(_(u'membership policy'), choices=MEMBERSHIP_POLICY_CHOICES, default=OPEN)
    video_policy = models.IntegerField(_(u'video policy'), choices=VIDEO_POLICY_CHOICES, default=MEMBER_REMOVE)
    is_visible = models.BooleanField(_(u'publicly Visible?'), default=True)
    videos = models.ManyToManyField(Video, through='TeamVideo',  verbose_name=_('videos'))
    users = models.ManyToManyField(User, through='TeamMember', related_name='teams', verbose_name=_('users'))
    points = models.IntegerField(default=0, editable=False)
    applicants = models.ManyToManyField(User, through='Application', related_name='applicated_teams', verbose_name=_('applicants'))
    created = models.DateTimeField(auto_now_add=True)
    highlight = models.BooleanField(default=False)
    video = models.ForeignKey(Video, null=True, blank=True, related_name='intro_for_teams', verbose_name=_(u'Intro Video'))
    application_text = models.TextField(blank=True)
    page_content = models.TextField(_(u'Page content'), blank=True, help_text=_(u'You can use markdown. This will replace Description.'))
    is_moderated = models.BooleanField(default=False)
    header_html_text = models.TextField(blank=True, default='', help_text=_(u"HTML that appears at the top of the teams page."))
    last_notification_time = models.DateTimeField(editable=False, default=datetime.datetime.now)

    projects_enabled = models.BooleanField(default=False)
    workflow_enabled = models.BooleanField(default=False)
    
    objects = TeamManager()
    
    class Meta:
        ordering = ['-name']
        verbose_name = _(u'Team')
        verbose_name_plural = _(u'Teams')


       


    
    def __unicode__(self):
        return self.name
 
    def render_message(self, msg):
        context = {
            'team': self, 
            'msg': msg,
            'author': msg.author,
            'author_page': msg.author.get_absolute_url(),
            'team_page': self.get_absolute_url(),
            "STATIC_URL": settings.STATIC_URL,
        }
        return render_to_string('teams/_team_message.html', context)
    
    def is_open(self):
        return self.membership_policy == self.OPEN
    
    def is_by_application(self):
        return self.membership_policy == self.APPLICATION
    
    @classmethod
    def get(cls, slug, user=None, raise404=True):
        if user:
            qs = cls.objects.for_user(user)
        else:
            qs = cls.objects.filter(is_visible=True)
        try:
            return qs.get(slug=slug)
        except cls.DoesNotExist:
            try:
                return qs.get(pk=int(slug))
            except (cls.DoesNotExist, ValueError):
                pass
            
        if raise404:
            raise Http404       
    
    def logo_thumbnail(self):
        if self.logo:
            return self.logo.thumb_url(100, 100)

    def small_logo_thumbnail(self):
        if self.logo:
            return self.logo.thumb_url(50, 50)
    
    @models.permalink
    def get_absolute_url(self):
        return ('teams:detail', [self.slug])
    
    def get_site_url(self):
        return 'http://%s%s' % (Site.objects.get_current().domain, self.get_absolute_url())
    

    def _is_role(self, user, role=None):
        if not user.is_authenticated():
            return False
        qs = self.members.filter(user=user)
        if role:
            qs = qs.filter(role=role)
        return qs.exists()
        
    def is_manager(self, user):
        return self._is_role(user, TeamMember.ROLE_MANAGER)

    def is_member(self, user):
        return self._is_role(user)
    
    

    def is_contributor(self, user, authenticated=True):
        """
        Contibutors can add new subs videos but they migh need to be moderated
        """
        return self._is_role(user, TeamMember.ROLE_CONTRIBUTOR)
    
    def can_remove_video(self, user, team_video=None):
        if not user.is_authenticated():
            return False          
        if self.video_policy == self.MANAGER_REMOVE and self.is_manager(user):
            return True
        if self.video_policy == self.MEMBER_REMOVE and self.is_member(user):
            return True
        return False
    
    def can_edit_video(self, user, team_video=None):
        if not user.is_authenticated():
            return False
        return self.can_add_video(user)

    def can_see_video(self, user, team_video=None):
        if not user.is_authenticated():
            return False
        return self.is_member(user)
    
    def can_add_video(self, user):
        if not user.is_authenticated():
            return False
        if self.video_policy == self.MANAGER_REMOVE:
            return self.is_manager(user)
        return self.is_member(user)

    def can_invite(self, user):
        if self.membership_policy == self.INVITATION_BY_MANAGER:
            return self.is_manager(user)
        
        return self.is_member(user)

    # moderation
    
    def get_pending_moderation( self, video=None):
        from videos.models import SubtitleVersion
        qs =  SubtitleVersion.objects.filter(language__video__moderated_by=self, moderation_status=WAITING_MODERATION)
        if video is not None:
            qs = qs.filter(language__video=video)
        return qs    
            

    def can_add_moderation(self, user):
        if not user.is_authenticated():
            return False
        return self.is_manager(user)
        
    def can_remove_moderation(self, user):
        if not user.is_authenticated():
            return False
        return self.is_manager(user)

    def video_is_moderated_by_team(self, video):
        return video.moderated_by == self
    
    def can_approve_application(self, user):
        return self.is_member(user)
    
    @property
    def member_count(self):
        if not hasattr(self, '_member_count'):
            setattr(self, '_member_count', self.users.count())
        return self._member_count
    
    @property
    def videos_count(self):
        if not hasattr(self, '_videos_count'):
            setattr(self, '_videos_count', self.videos.count())
        return self._videos_count        
    
    @property
    def applications_count(self):
        if not hasattr(self, '_applications_count'):
            setattr(self, '_applications_count', self.applications.count())
        return self._applications_count

    def _lang_pair(self, lp, suffix):
        return SQ(content="{0}_{1}_{2}".format(lp[0], lp[1], suffix))

    def _sq_expression(self, sq_list):
        if len(sq_list) == 0:
            return None
        else:
            return reduce(lambda x, y: x | y, sq_list)

    def _filter(self, sqs, sq_list):
        from haystack.query import SQ
        sq_expression = self._sq_expression(sq_list)
        return None if (sq_expression is None) else sqs.filter(sq_expression)

    def _exclude(self, sqs, sq_list):
        if sqs is None:
            return None
        sq_expression = self._sq_expression(sq_list)
        return sqs if sq_expression is None else sqs.exclude(sq_expression)

    def _base_sqs(self, is_member=False, project=None):
        from teams.search_indexes import TeamVideoLanguagesIndex
        if is_member:
            qs =  TeamVideoLanguagesIndex.results_for_members(self).filter(team_id=self.id)
        else:
            qs =  TeamVideoLanguagesIndex.results().filter(team_id=self.id)
        if project is not None:
            qs = qs.filter(project_pk=project.pk)
        return qs

    def get_videos_for_languages_haystack(self, languages, project=None, user=None):
        from utils.multi_query_set import MultiQuerySet

        is_member = user and user.is_authenticated() and self.members.filter(user=user).exists()
        languages.extend([l[:l.find('-')] for l in 
                           languages if l.find('-') > -1])
        languages = list(set(languages))

        pairs_m, pairs_0, langs = [], [], []
        for l1 in languages:
            langs.append(SQ(content='S_{0}'.format(l1)))
            for l0 in languages:
                if l1 != l0:
                    pairs_m.append(self._lang_pair((l1, l0), "M"))
                    pairs_0.append(self._lang_pair((l1, l0), "0"))

        qs_list = []
        
        # FIXME do project filtering here
        qs = self._filter(self._base_sqs(is_member), pairs_m )
        qs_list.append(qs)
        qs_list.append(self._exclude(self._filter(self._base_sqs(is_member, project=project), pairs_0), 
                                     pairs_m))
        qs_list.append(self._exclude(
                self._base_sqs(is_member, project).filter(
                    original_language__in=languages), 
                pairs_m + pairs_0).order_by('has_lingua_franca'))
        qs_list.append(self._exclude(
                self._filter(self._base_sqs(is_member, project=project), langs),
                pairs_m + pairs_0).exclude(original_language__in=languages))
        qs_list.append(self._exclude(
                self._base_sqs(is_member, project=project), 
                langs + pairs_m + pairs_0).exclude(
                original_language__in=languages))
        mqs = MultiQuerySet(*[qs for qs in qs_list if qs is not None])
        # this is way more efficient than making a count from all the
        # constituent querysets.
        mqs.set_count(self._base_sqs(is_member).count())
        return qs_list, mqs

    def get_videos_for_languages(self, languages, CUTTOFF_DUPLICATES_NUM_VIDEOS_ON_TEAMS):
        from utils.multi_query_set import TeamMultyQuerySet
        languages.extend([l[:l.find('-')] for l in languages if l.find('-') > -1])
        
        langs_pairs = []
        
        for l1 in languages:
            for l0 in languages:
                if not l1 == l0:
                    langs_pairs.append('%s_%s' % (l1, l0))

        qs = TeamVideoLanguagePair.objects.filter(language_pair__in=langs_pairs, team=self) \
            .select_related('team_video', 'team_video__video')
        lqs = TeamVideoLanguage.objects.filter(team=self).select_related('team_video', 'team_video__video')

        qs1 = qs.filter(percent_complete__gt=0,percent_complete__lt=100)
        qs2 = qs.filter(percent_complete=0)
        qs3 = lqs.filter(is_original=True, is_complete=False, language__in=languages).order_by("is_lingua_franca")
        qs4 = lqs.filter(is_original=False, forked=True, is_complete=False, language__in=languages)
        mqs = TeamMultyQuerySet(qs1, qs2, qs3, qs4)

        total_count = TeamVideo.objects.filter(team=self).count()

        additional = TeamVideoLanguagePair.objects.none()
        all_videos = TeamVideo.objects.filter(team=self).select_related('video')

        if total_count == 0:
            mqs = all_videos
        else:
            if  total_count < CUTTOFF_DUPLICATES_NUM_VIDEOS_ON_TEAMS:
                additional = all_videos.exclude(pk__in=[x.id for x in mqs ])
            else:
                additional = all_videos
            mqs = TeamMultyQuerySet(qs1, qs2, qs3, qs4 , additional)

        return {
            'qs': qs,
            'lqs': lqs,
            'qs1': qs1,
            'qs2': qs2,
            'qs3': qs3,
            'qs4': qs4,
            'videos':mqs,
            'videos_count': len(mqs),
            'additional_count': additional.count(),
            'additional': additional[:50],
            'lqs': lqs,
            'qs': qs,
            }

    @property
    def default_project(self):
        try:
            return Project.objects.get(team=self, slug=Project.DEFAULT_NAME)
        except Project.DoesNotExist:
            p = Project(team=self,name=Project.DEFAULT_NAME)
            p.save()
            return p

    def save(self, *args, **kwargs):
        creating = self.pk is None
        super(Team, self).save(*args, **kwargs)
        if creating:
            # make sure we create a default project
            self.default_project

    
    def to_dict(self):
        return { 'pk': self.pk,
                 'name': self.name,
                 'description': self.description,
                 'membership_policy': self.membership_policy,
                 'video_policy': self.video_policy,
                 'logo': self.logo_thumbnail() if self.logo else None,
                 'workflow_enabled': self.workflow_enabled, }
# this needs to be constructed after the model definition since we need a
# reference to the class itself
Team._meta.permissions = TEAM_PERMISSIONS

class ProjectManager(models.Manager):

    def for_team(self, team_identifier):
        if hasattr(team_identifier,"pk"):
            team = team_identifier
        elif isinstance(team_identifier, int):
            team = Team.objects.get(pk=team_identifier)
        elif isinstance(team_identifier, str):
            team = Team.objects.get(slug=team_identifier)
        return Project.objects.filter(team=team).exclude(name=Project.DEFAULT_NAME)
    
class Project(models.Model):
    #: All tvs belong to a project, wheather the team has enabled them or not
    # the default project is just a convenience UI that pretends to be part of
    # the team . If this ever gets changed, you need to change migrations/0044
    DEFAULT_NAME = "_root"
    
    team = models.ForeignKey(Team)
    created = models.DateTimeField(auto_now_add=True)
    modified = models.DateTimeField(blank=True)

    name = models.CharField(max_length=255, null=False)
    description = models.TextField(blank=True, null=True, max_length=2048)
    guidelines = models.TextField(blank=True, null=True, max_length=2048)

    slug = models.SlugField(blank=True)
    order = models.PositiveIntegerField(default=0)

    workflow_enabled = models.BooleanField(default=False)

    objects = ProjectManager()
    
    def __unicode__(self):
        if self.is_default_project:
            return u"---"
        return u"%s" % (self.name)

    def save(self, slug=None,*args, **kwargs):
        self.modified = datetime.datetime.now()
        slug = slug if slug is not None else self.slug or self.name
        self.slug = pan_slugify(slug)
        super(Project, self).save(*args, **kwargs)

    @property
    def is_default_project(self):
        return self.name == Project.DEFAULT_NAME
        
    class Meta:
        unique_together = (
                ("team", "name",),
                ("team", "slug",),
        )
        permissions = PROJECT_PERMISSIONS
        

class TeamVideo(models.Model):
    team = models.ForeignKey(Team)
    video = models.ForeignKey(Video)
    title = models.CharField(max_length=2048, blank=True)
    description = models.TextField(blank=True,
        help_text=_(u'Use this space to explain why you or your team need to caption or subtitle this video. Adding a note makes volunteers more likely to help out!'))
    thumbnail = S3EnabledImageField(upload_to='teams/video_thumbnails/', null=True, blank=True, 
        help_text=_(u'We automatically grab thumbnails for certain sites, e.g. Youtube'))
    all_languages = models.BooleanField(_('Need help with all languages'), default=False, 
        help_text=_('If you check this, other languages will not be displayed.'))
    added_by = models.ForeignKey(User)
    created = models.DateTimeField(auto_now_add=True)
    completed_languages = models.ManyToManyField(SubtitleLanguage, blank=True)

    project = models.ForeignKey(Project)

    
    class Meta:
        unique_together = (('team', 'video'),)
    
    def __unicode__(self):
        return self.title or unicode(self.video)

    def can_remove(self, user):
        return self.team.can_remove_video(user, self)
    
    def can_edit(self, user):
        return self.team.can_edit_video(user, self)
    
    def link_to_page(self):
        if self.all_languages:
            return self.video.get_absolute_url()
        return self.video.video_link()
        
    @models.permalink
    def get_absolute_url(self):
        return ('teams:team_video', [self.pk])
    
    def get_thumbnail(self):
        if self.thumbnail:
            return self.thumbnail.thumb_url(100, 100)

        if self.video.thumbnail:
            th = self.video.get_thumbnail()
            if th:
                return th
        
        if self.team.logo:
            return self.team.logo_thumbnail()
        
        return ''

    def _original_language(self):
        if not hasattr(self, 'original_language_code'):
            sub_lang = self.video.subtitle_language()
            setattr(self, 'original_language_code', None if not sub_lang else sub_lang.language)
        return getattr(self, 'original_language_code')

    def _calculate_percent_complete(self, sl0, sl1):
        # maybe move this to Video model in future.
        if not sl0 or not sl0.is_dependable():
            return -1
        if not sl1:
            return 0
        if sl1.language == self._original_language():
            return -1
        if sl1.is_dependent():
            if sl1.percent_done == 0:
                return 0
            elif sl0.is_dependent():
                l_dep0 = sl0.real_standard_language()
                l_dep1 = sl1.real_standard_language()
                if l_dep0 and l_dep1 and l_dep0.id == l_dep1.id:
                    return sl1.percent_done
                else:
                    return -1
            else:
                l_dep1 = sl1.real_standard_language()
                return sl1.percent_done if \
                    l_dep1 and l_dep1.id == sl0.id else -1
        else:
            sl1_subtitle_count = 0
            latest_version = sl1.latest_version()
            if latest_version:
                sl1_subtitle_count = latest_version.subtitle_set.count()
            return 0 if sl1_subtitle_count == 0 else -1

    def _update_team_video_language_pair(self, lang0, sl0, lang1, sl1):
        percent_complete = self._calculate_percent_complete(sl0, sl1)
        if sl1 is not None:
            tvlps = TeamVideoLanguagePair.objects.filter(
                team_video=self,
                subtitle_language_0=sl0,
                subtitle_language_1=sl1)
        else:
            tvlps = TeamVideoLanguagePair.objects.filter(
                team_video=self,
                subtitle_language_0__language=lang0,
                language_1=lang1)
        tvlp = None if len(tvlps) == 0 else tvlps[0]
        if not tvlp and percent_complete != -1:
            tvlp = TeamVideoLanguagePair(
                team_video=self,
                team=self.team,
                video=self.video,
                language_0=lang0,
                subtitle_language_0=sl0,
                language_1=lang1,
                subtitle_language_1=sl1,
                language_pair='{0}_{1}'.format(lang0, lang1),
                percent_complete=percent_complete)
            tvlp.save()
        elif tvlp and percent_complete != -1:
            tvlp.percent_complete = percent_complete
            tvlp.save()
        elif tvlp and percent_complete == -1:
            tvlp.delete()

    def _make_lp(self, lang0, sl0, lang1, sl1):
        percent_complete = self._calculate_percent_complete(sl0, sl1)
        if percent_complete == -1:
            return None
        else:
            return "{0}_{1}_{2}".format(
                lang0, lang1, "M" if percent_complete > 0 else "0")

    def _update_tvlp_for_languages(self, lang0, lang1, langs):
        sl0_list = langs.get(lang0, [])
        sl1_list = langs.get(lang1, [])
        if len(sl1_list) == 0:
            sl1_list = [None]
        for sl0 in sl0_list:
            for sl1 in sl1_list:
                self._update_team_video_language_pair(lang0, sl0, lang1, sl1)

    def _add_lps_for_languages(self, lang0, lang1, langs, lps):
        sl0_list = langs.get(lang0, [])
        sl1_list = langs.get(lang1, [])
        if len(sl1_list) == 0:
            sl1_list = [None]
        for sl0 in sl0_list:
            for sl1 in sl1_list:
                lp = self._make_lp(lang0, sl0, lang1, sl1)
                if lp:
                    lps.append(lp)

    def update_team_video_language_pairs(self, lang_code_list=None):
        TeamVideoLanguagePair.objects.filter(team_video=self).delete()
        if lang_code_list is None:
            lang_code_list = [item[0] for item in settings.ALL_LANGUAGES]
        langs = self.video.subtitle_language_dict()
        for lang0, sl0_list in langs.items():
            for lang1 in lang_code_list:
                if lang0 == lang1:
                    continue
                self._update_tvlp_for_languages(lang0, lang1, langs)

    def searchable_language_pairs(self):
        lps = []
        lang_code_list = [item[0] for item in settings.ALL_LANGUAGES]
        langs = self.video.subtitle_language_dict()
        for lang0, sl0_list in langs.items():
            for lang1 in lang_code_list:
                if lang0 == lang1:
                    continue
                self._add_lps_for_languages(lang0, lang1, langs, lps)
        return lps

    def _add_searchable_language(self, language, sublang_dict, sls):
        complete_sublangs = []
        if language in sublang_dict:
            complete_sublangs = [sl for sl in sublang_dict[language] if 
                                 not sl.is_dependent() and sl.is_complete]
        if len(complete_sublangs) == 0:
            sls.append("S_{0}".format(language))

    def searchable_languages(self):
        sls = []
        langs = self.video.subtitle_language_dict()
        for lang in settings.ALL_LANGUAGES:
            self._add_searchable_language(lang[0], langs, sls)
        return sls

    def get_pending_moderation(self):
        return self.team.get_pending_moderation(self.video)

    def save(self, *args, **kwargs):
        if not hasattr(self, "project"):
            self.project = self.team.default_project
        super(TeamVideo, self).save(*args, **kwargs)
        


    def is_checked_out(self, ignore_user=None):
        '''Return whether this video is checked out in a task.

        If a user is given, checkouts by that user will be ignored.  This
        provides a way to ask "can user X check out or work on this task?".

        This is similar to the writelocking done on Videos and
        SubtitleLanguages.

        '''
        tasks = self.task_set.filter(
                # Find all tasks for this video which:
                deleted=False,           # - Aren't deleted
                assignee__isnull=False,  # - Are assigned to someone
                language="",             # - Aren't specific to a language
                completed__isnull=True,  # - Are unfinished
        )
        if ignore_user:
            tasks = tasks.exclude(assignee=ignore_user)

        return tasks.exists()

def team_video_save(sender, instance, created, **kwargs):
    update_one_team_video.delay(instance.id)

def team_video_delete(sender, instance, **kwargs):
    # not using an async task for this since the async task 
    # could easily execute way after the instance is gone,
    # and backend.remove requires the instance.
    tv_search_index = site.get_index(TeamVideo)
    tv_search_index.backend.remove(instance)

post_save.connect(team_video_save, TeamVideo, dispatch_uid="teams.teamvideo.team_video_save")
post_delete.connect(team_video_delete, TeamVideo, dispatch_uid="teams.teamvideo.team_video_delete")

class TeamVideoLanguage(models.Model):
    team_video = models.ForeignKey(TeamVideo, related_name='languages')
    video = models.ForeignKey(Video)
    language = models.CharField(max_length=16, choices=ALL_LANGUAGES,  null=False, blank=False, db_index=True)
    subtitle_language = models.ForeignKey(SubtitleLanguage, null=True)
    team = models.ForeignKey(Team)
    is_original = models.BooleanField(default=False, db_index=True)
    forked = models.BooleanField(default=True, db_index=True)
    is_complete = models.BooleanField(default=False, db_index=True)
    percent_done = models.IntegerField(default=0, db_index=True)
    is_lingua_franca = models.BooleanField(default=False, db_index=True)
    
    class Meta:
        unique_together = (('team_video', 'subtitle_language'),)

    def __unicode__(self):
        return "video: %s - %s" % (self.video.pk, self.get_language_display())

    @classmethod
    def _save_tvl_for_sl(cls, tv, sl):
        tvl = cls(
            team_video=tv,
            video=tv.video,
            language=sl.language,
            subtitle_language=sl,
            team=tv.team,
            is_original=sl.is_original,
            forked=sl.is_forked,
            is_complete=sl.is_complete,
            percent_done=sl.percent_done)
        tvl.save()

    @classmethod
    def _save_tvl_for_l(cls, tv, lang):
        tvl = cls(
            team_video=tv,
            video=tv.video,
            language=lang,
            subtitle_language=None,
            team=tv.team,
            is_original=False,
            forked=True,
            is_complete=False,
            percent_done=0)
        tvl.save()

    @classmethod
    def _update_for_language(cls, tv, language, sublang_dict):
        if language in sublang_dict:
            sublangs = sublang_dict[language]
            for sublang in sublangs:
                    cls._save_tvl_for_sl(tv, sublang)
        else:
            cls._save_tvl_for_l(tv, language)

    @classmethod
    def update(cls, tv):
        cls.objects.filter(team_video=tv).delete()

        sublang_dict = tv.video.subtitle_language_dict()
        for lang in settings.ALL_LANGUAGES:
            cls._update_for_language(tv, lang[0], sublang_dict)

    @classmethod
    def update_for_language(cls, tv, language):
        cls.objects.filter(team_video=tv, language=language).delete()
        cls._update_for_language(
            tv, language, tv.video.subtitle_language_dict())

    def save(self, *args, **kwargs):
        self.is_lingua_franca = self.language in settings.LINGUA_FRANCAS
        return super(TeamVideoLanguage, self).save(*args, **kwargs)


    def is_checked_out(self, ignore_user=None):
        '''Return whether this language is checked out in a task.

        If a user is given, checkouts by that user will be ignored.  This
        provides a way to ask "can user X check out or work on this task?".

        This is similar to the writelocking done on Videos and
        SubtitleLanguages.

        '''
        tasks = self.team_video.task_set.filter(
                # Find all tasks for this video which:
                deleted=False,           # - Aren't deleted
                assignee__isnull=False,  # - Are assigned to someone
                language=self.language,  # - Apply to this language
                completed__isnull=True,  # - Are unfinished
        )
        if ignore_user:
            tasks = tasks.exclude(assignee=ignore_user)

        return tasks.exists()

    class Meta:
        permissions = LANG_PERMISSIONS

        

class TeamVideoLanguagePair(models.Model):
    team_video = models.ForeignKey(TeamVideo)
    team = models.ForeignKey(Team)
    video = models.ForeignKey(Video)
    # language_0 and subtitle_language_0 are the potential standards.
    language_0 = models.CharField(max_length=16, choices=ALL_LANGUAGES, db_index=True)
    subtitle_language_0 = models.ForeignKey(
        SubtitleLanguage, null=False, related_name="team_video_language_pairs_0")
    language_1 = models.CharField(max_length=16, choices=ALL_LANGUAGES, db_index=True)
    subtitle_language_1 = models.ForeignKey(
        SubtitleLanguage, null=True, related_name="team_video_language_pairs_1")
    language_pair = models.CharField(db_index=True, max_length=16)
    percent_complete = models.IntegerField(db_index=True, default=0)

class TeamMemderManager(models.Manager):
    use_for_related_fields = True
    
    def create_first_member(self, team, user):
        """
        Make sure that new teams always have a 'owner'
        member
        """
        tm =  TeamMember(
        team=team, user=user , role=ROLE_OWNER)
        tm.save()
        return tm

    def managers(self):
        return self.get_query_set().filter(role=TeamMember.ROLE_MANAGER)
    
class TeamMember(models.Model):
    ROLE_OWNER = ROLE_OWNER
    ROLE_ADMIN = ROLE_ADMIN
    ROLE_MANAGER = ROLE_MANAGER
    ROLE_CONTRIBUTOR = ROLE_CONTRIBUTOR
    
    ROLES = (
        (ROLE_OWNER, _("Owner")),
        (ROLE_MANAGER, _("Manager")),
        (ROLE_ADMIN, _("Admin")),
        (ROLE_CONTRIBUTOR, _("Contributor")),
    )
    
    team = models.ForeignKey(Team, related_name='members')
    user = models.ForeignKey(User, related_name='user')
    role = models.CharField(max_length=16, default=ROLE_CONTRIBUTOR, choices=ROLES)
    changes_notification = models.BooleanField(default=True)

    
    objects = TeamMemderManager()

    def __unicode__(self):
        return u'%s' % self.user

    def can_assign_tasks(self):
        # TODO: Adjust once final roles are in place.
        # return self.role in ('Manager', 'Admin', 'Owner')
        return self.role == 'manager'

    def can_delete_tasks(self):
        # TODO: Adjust once final roles are in place.
        # return self.role in ('Admin', 'Owner')
        return self.role == 'manager'

        
        
    def save(self, *args, **kwargs):
        creating = self.pk is None
        super(TeamMember, self).save(*args, **kwargs)
        if creating:
            MembershipNarrowing.objects.create_for_member(self)
            
    class Meta:
        unique_together = (('team', 'user'),)

class MembershipNarrowingManager(models.Manager):

    def get_for_team(self, team, user):
        return self.filter(membership__id_in=[x.id for x in team.members.filter(user=user)])
        
    def for_type(self, model):
        return self.filter(content_type=ContentType.objects.get_for_model(model))
        
    def get_for_projects(self, member):
        return self.for_type(Project).filter(member=member)
        
    def get_for_langs(self, member):
        return self.for_type(TeamVideoLanguage).filter(member=member)

    def create_for_member(self, member):
        return MembershipNarrowing.objects.get_or_create(
            content_type = ContentType.objects.get_for_model(member.team),
            object_pk = member.pk,
            member = member,
            added_by=None)[0]
        
    def create(self, member, narrowing, added_by):
        return MembershipNarrowing.objects.get_or_create(
            content_type = ContentType.objects.get_for_model(narrowing),
            object_pk = narrowing.pk,
            member = member,
            added_by=added_by)[0]
        
class MembershipNarrowing(models.Model):
    """
    Represent narrowings that can be made on memberships.
    A membership permission might be applyed to an entire
    team, or be narrowed to projet or to a language.
    """
    member = models.ForeignKey(TeamMember, related_name="narrowings")
    content_type = models.ForeignKey(ContentType,
        related_name="content_type_set_for_%(class)s")
    object_pk = models.TextField('object ID')
    content = generic.GenericForeignKey(ct_field="content_type", fk_field="object_pk")

    created = models.DateTimeField(auto_now_add=True, blank=None)
    modified = models.DateTimeField(auto_now=True, blank=None)
    added_by = models.ForeignKey(TeamMember, related_name="narrowing_includer", null=True, blank=True)
    
    objects = MembershipNarrowingManager()
    
    @property
    @classmethod
    def allowed_types(self):
        """
        Cache the content types where we allow narrowing to occur. This
        should not be needed to change at run time. If it ever does, just
        clear _cached_allowed_types
        This cannot simply be declared on the model class since by the
        time them class is defined we might or might not have loaded the
        other models (+ contenty type), this means that we can have
        an error related to import order and it is not very predictable,
        e.g. would fail when running the unit tests on sqlite but not on
        msyql
        """
        if not MembershipNarrowing._cached_allowed_types:

            MembershipNarrowing._cached_allowed_types = \
                         [ContentType.objects.get_for_model(m) for m in \
                          [Team, Project, TeamVideoLanguage]]
        return MembershipNarrowing._cached_allowed_types
        
    def __unicode__(self):
        return u"Permission restriction for %s and %s " % (
            self.member, self.content)

    def save(self, *args, **kwargs):
        if False and self.content_type not in MembershipNarrowing.allowed_types:
            raise ValueError("MembershipNarrowing cannot be assigned to %s, allowed types are %s"
            % (self.content, MembershipNarrowing.allowed_types))
        super(MembershipNarrowing, self).save(*args, **kwargs)   
        
class Application(models.Model):
    team = models.ForeignKey(Team, related_name='applications')
    user = models.ForeignKey(User, related_name='team_applications')
    note = models.TextField(blank=True)
    
    class Meta:
        unique_together = (('team', 'user'),)
    
    def _send_approve_message(self):
        msg = Message()
        msg.subject = ugettext(u'Your application to %s was approved!') % self.team.name
        msg.content = ugettext(u"Congratulations, you're now a member of %s!") % self.team.name
        msg.user = self.user
        msg.object = self.team
        msg.author = User.get_anonymous()
        msg.save()

    def _send_deny_message(self):
        msg = Message()
        msg.subject = ugettext(u'Your application to %s was denied.') % self.team.name
        msg.content = ugettext(u"Sorry, your application to %s was rejected.") % self.team.name
        msg.user = self.user
        msg.object = self.team
        msg.author = User.get_anonymous()
        msg.save()


    def approve(self):
        TeamMember.objects.get_or_create(team=self.team, user=self.user)
        self._send_approve_message()
        self.delete()
    
    def deny(self):
        self._send_deny_message()
        self.delete()
        
class Invite(models.Model):
    team = models.ForeignKey(Team, related_name='invitations')
    user = models.ForeignKey(User, related_name='team_invitations')
    note = models.TextField(blank=True, max_length=200)
    author = models.ForeignKey(User)
    
    class Meta:
        unique_together = (('team', 'user'),)
    
    def accept(self):
        TeamMember.objects.get_or_create(team=self.team, user=self.user)
        self.delete()
        
    def deny(self):
        self.delete()
    
    def render_message(self, msg):
        message = get_object_or_none(Setting, team=self.team,
                                     key=Setting.KEY_IDS['messages_invite'])
        return render_to_string('teams/_invite_message.html',
                                {'invite': self, 'custom_message': message})
    
    def message_json_data(self, data, msg):
        data['can-reaply'] = False
        return data
    
models.signals.pre_delete.connect(Message.on_delete, Invite)
    
def invite_send_message(sender, instance, created, **kwargs):
    if created:
        msg = Message()
        msg.subject = ugettext(u'Invitation to join a team')
        msg.user = instance.user
        msg.object = instance
        msg.author = instance.author
        msg.save()
    
post_save.connect(invite_send_message, Invite, dispatch_uid="teams.invite.send_invite")


class Workflow(models.Model):
    PERM_CHOICES = (
        (10, 'Disabled'),
        (20, 'Public'),
        (30, 'Team Members'),
        (40, 'Managers'),
        (50, 'Admins'),
        (60, 'Owner'),
    )
    PERM_NAMES = dict(PERM_CHOICES)
    PERM_IDS = dict([choice[::-1] for choice in PERM_CHOICES])

    team = models.ForeignKey(Team)

    project = models.ForeignKey(Project, blank=True, null=True)
    team_video = models.ForeignKey(TeamVideo, blank=True, null=True)

    perm_subtitle = models.PositiveIntegerField(choices=PERM_CHOICES,
            verbose_name='subtitle permissions', default=PERM_IDS['Public'])
    perm_translate = models.PositiveIntegerField(choices=PERM_CHOICES,
            verbose_name='translate permissions', default=PERM_IDS['Public'])
    perm_review = models.PositiveIntegerField(choices=PERM_CHOICES,
            verbose_name='review permission', default=PERM_IDS['Managers'])
    perm_approve = models.PositiveIntegerField(choices=PERM_CHOICES,
            verbose_name='approve permissions', default=PERM_IDS['Owner'])

    created = models.DateTimeField(auto_now_add=True, editable=False)
    modified = models.DateTimeField(auto_now=True, editable=False)

    class Meta:
        unique_together = ('team', 'project', 'team_video')


    @classmethod
    def _get_target_team_id(cls, id, type):
        if type == 'team_video':
            return TeamVideo.objects.get(pk=id).team.id
        elif type == 'project':
            return Project.objects.get(pk=id).team.id
        else:
            return id

    @classmethod
    def get_for_target(cls, id, type, workflows=None):
        '''Return the most specific Workflow for the given target.

        If target object does not exist, None is returned.

        If workflows is given, it should be a QuerySet or List of all Workflows
        for the TeamVideo's team.  This will let you look it up yourself once
        and use it in many of these calls to avoid hitting the DB each time.

        If workflows is not given it will be looked up with one DB query.

        '''


        if not workflows:
            team_id = Workflow._get_target_team_id(id, type)
            workflows = list(Workflow.objects.filter(team=team_id))
        else:
            team_id = workflows[0].team.pk

        if not workflows:
            return Workflow(team=Team.objects.get(pk=team_id))

        if type == 'team_video':
            try:
                return [w for w in workflows
                        if w.team_video and w.team_video.id == id][0]
            except IndexError:
                # If there's no video-specific workflow for this video, there
                # might be a workflow for its project, so we'll start looking
                # for that instead.
                team_video = TeamVideo.objects.get(pk=id)
                id, type = team_video.project.id, 'project'

        if type == 'project':
            try:
                return [w for w in workflows
                        if w.project and w.project.id == id and not w.team_video][0]
            except IndexError:
                # If there's no project-specific workflow for this project,
                # there might be one for its team, so we'll fall through.
                pass

        return [w for w in workflows
                if (not w.project) and (not w.team_video)][0]


    @classmethod
    def get_for_team_video(cls, team_video, workflows=None):
        '''Return the most specific Workflow for the given team_video.

        If workflows is given, it should be a QuerySet or List of all Workflows
        for the TeamVideo's team.  This will let you look it up yourself once
        and use it in many of these calls to avoid hitting the DB each time.

        If workflows is not given it will be looked up with one DB query.

        '''
        return Workflow.get_for_target(team_video.id, 'team_video', workflows)

    @classmethod
    def get_for_project(cls, project, workflows=None):
        '''Return the most specific Workflow for the given project.

        If workflows is given, it should be a QuerySet or List of all Workflows
        for the Project's team.  This will let you look it up yourself once
        and use it in many of these calls to avoid hitting the DB each time.

        If workflows is not given it will be looked up with one DB query.

        '''
        return Workflow.get_for_target(project.id, 'project', workflows)

    @classmethod
    def add_to_team_videos(cls, team_videos):
        '''Add the appropriate Workflow objects to each TeamVideo as .workflow.

        This will only perform one DB query, and it will add the most specific
        workflow possible to each TeamVideo.

        '''
        if not team_videos:
            return []

        workflows = list(Workflow.objects.filter(team=team_videos[0].team))

        for tv in team_videos:
            tv.workflow = Workflow.get_for_team_video(tv, workflows)


    def get_specific_target(self):
        return self.team_video or self.project or self.team

    def __unicode__(self):
        return u'Workflow for %s' % self.get_specific_target()


    # Convenience functions for checking if a step of the workflow is enabled.
    def _step_enabled(self, step):
        return step != Workflow.PERM_IDS['Disabled']

    @property
    def subtitle_enabled(self):
        return self._step_enabled(self.perm_subtitle)

    @property
    def translate_enabled(self):
        return self._step_enabled(self.perm_translate)

    @property
    def review_enabled(self):
        return self._step_enabled(self.perm_review)

    @property
    def approve_enabled(self):
        return self._step_enabled(self.perm_approve)


    def to_dict(self):
        '''Return a dictionary representing this workflow.

        Useful for converting to JSON.

        '''
        return { 'pk': self.id,
                 'team': self.team.slug if self.team else None,
                 'project': self.project.id if self.project else None,
                 'team_video': self.team_video.id if self.team_video else None,
                 'perm_subtitle': self.perm_subtitle,
                 'perm_translate': self.perm_translate,
                 'perm_review': self.perm_review,
                 'perm_approve': self.perm_approve, }


class Task(models.Model):
    TYPE_CHOICES = (
        (10, 'Subtitle'),
        (20, 'Translate'),
        (30, 'Review'),
        (40, 'Approve'),
    )
    TYPE_NAMES = dict(TYPE_CHOICES)
    TYPE_IDS = dict([choice[::-1] for choice in TYPE_CHOICES])

    APPROVED_CHOICES = (
        (10, 'In Progress'),
        (20, 'Approved'),
        (30, 'Rejected'),
    )
    APPROVED_NAMES = dict(APPROVED_CHOICES)
    APPROVED_IDS = dict([choice[::-1] for choice in APPROVED_CHOICES])
    APPROVED_FINISHED_IDS = (20, 30)

    type = models.PositiveIntegerField(choices=TYPE_CHOICES)

    team = models.ForeignKey(Team)
    team_video = models.ForeignKey(TeamVideo)
    language = models.CharField(max_length=16, choices=ALL_LANGUAGES, blank=True,
                                db_index=True)
    assignee = models.ForeignKey(User, blank=True, null=True)
    subtitle_language = models.ForeignKey(SubtitleLanguage, blank=True, null=True)

    deleted = models.BooleanField(default=False)

    created = models.DateTimeField(auto_now_add=True, editable=False)
    modified = models.DateTimeField(auto_now=True, editable=False)
    completed = models.DateTimeField(blank=True, null=True)

    # Review and Approval -specific fields
    approved = models.PositiveIntegerField(choices=APPROVED_CHOICES,
                                           null=True, blank=True)
    body = models.TextField(blank=True, default="")

    def __unicode__(self):
        return u'%d' % self.id


    def to_dict(self, user=None):
        '''Return a dictionary representing this task.

        Useful for converting to JSON.

        '''
        return { 'pk': self.id,
                 'team': self.team.id if self.team else None,
                 'team_video': self.team_video.id if self.team_video else None,
                 'team_video_display': unicode(self.team_video) if self.team_video else None,
                 'team_video_url': self.team_video.get_absolute_url() if self.team_video else None,
                 'type': Task.TYPE_NAMES[self.type],
                 'assignee': self.assignee.id if self.assignee else None,
                 'assignee_display': unicode(self.assignee) if self.assignee else None,
                 'language': self.language if self.language else None,
                 'language_display': SUPPORTED_LANGUAGES_DICT[self.language]
                                     if self.language else None,
                 'perform_allowed': self.perform_allowed(user) if user else None,
                 'completed': True if self.completed else False, }


    @property
    def workflow(self):
        '''Return the most specific workflow for this task's TeamVideo.'''
        return Workflow.get_for_team_video(self.team_video)


    def perform_allowed(self, user, workflow=None):
        '''Return True if the user is permitted to perform this task, False otherwise.'''
        if not user:
            return False

        # workflow = workflow or self.workflow

        # role_required = {'Subtitle': workflow.perm_subtitle,
        #                  'Translate': workflow.perm_translate,
        #                  'Review': workflow.perm_review,
        #                  'Approve': workflow.perm_approve}[Task.TYPE_NAMES[self.type]]

        # roles = [choice_name for choice_id, choice_name in Workflow.PERM_CHOICES]
        # roles_allowed = roles[:roles.index(role_required)+1]
        # user_role = user.role.type

        # return user_role in roles_allowed

        # TODO: Implement this once roles are in place.
        if not self.assignee:
            return True
        else:
            return user == self.assignee


    def complete(self):
        '''Mark as complete and return the next task in the process if applicable.'''
        self.completed = datetime.datetime.now()
        self.save()

        return { 'Subtitle': self._complete_subtitle,
                 'Translate': self._complete_translate,
                 'Review': self._complete_review,
                 'Approve': self._complete_review,
        }[Task.TYPE_NAMES[self.type]]()

    def _complete_subtitle(self):
        # Normally we would create the next task in the sequence here, but since
        # we don't create translation tasks ahead of time for efficieny reasons
        # we simply do nothing.
        return None

    def _complete_translate(self):
        if self.workflow.review_enabled:
            task = Task(team=self.team, team_video=self.team_video,
                        language=self.language, type=Task.TYPE_IDS['Review'])
        else:
            # The review step may be disabled.
            # If so, we move directly to the approve step.
            task = Task(team=self.team, team_video=self.team_video,
                        language=self.language, type=Task.TYPE_IDS['Approve'])

        task.save()
        return task

    def _complete_review(self):
        if self.workflow.approve_enabled:
            task = Task(team=self.team, team_video=self.team_video,
                        language=self.language, type=Task.TYPE_IDS['Approve'])
        task.save()
        return task

    def _complete_approve(self):
        pass


class SettingManager(models.Manager):
    use_for_related_fields = True

    def guidelines(self):
        keys = [key for key, name in Setting.KEY_CHOICES
                if name.startswith('guidelines_')]
        return self.get_query_set().filter(key__in=keys)

    def messages(self):
        keys = [key for key, name in Setting.KEY_CHOICES
                if name.startswith('messages_')]
        return self.get_query_set().filter(key__in=keys)

    def messages_guidelines(self):
        keys = [key for key, name in Setting.KEY_CHOICES
                if name.startswith('messages_') or name.startswith('guidelines_')]
        return self.get_query_set().filter(key__in=keys)

class Setting(models.Model):
    KEY_CHOICES = (
        (100, 'messages_invite'),
        (101, 'messages_manager'),
        (102, 'messages_admin'),
        (200, 'guidelines_subtitle'),
        (201, 'guidelines_translate'),
        (202, 'guidelines_review'),
    )
    KEY_NAMES = dict(KEY_CHOICES)
    KEY_IDS = dict([choice[::-1] for choice in KEY_CHOICES])

    key = models.PositiveIntegerField(choices=KEY_CHOICES)
    data = models.TextField(blank=True)
    team = models.ForeignKey(Team, related_name='settings')

    created = models.DateTimeField(auto_now_add=True, editable=False)
    modified = models.DateTimeField(auto_now=True, editable=False)

    objects = SettingManager()

    class Meta:
        unique_together = (('key', 'team'),)

    def __unicode__(self):
        return u'%s - %s' % (self.team, self.key_name)

    @property
    def key_name(self):
        return Setting.KEY_NAMES[self.key]

class TeamLanguagePreferenceManager(models.Manager):

    def _generate_writable(self, team):
        langs_set = set([x[0] for x in settings.ALL_LANGUAGES])
        tlp_allows_writes =  set([x['language_code'] for x in  self.for_team(team).filter(allow_writes=False).values("language_code")])
        return langs_set- tlp_allows_writes
            
    def _generate_readable(self, team):
        langs_set = set([x[0] for x in settings.ALL_LANGUAGES])
        tlp_allows_reads =  set([x['language_code'] for x in self.for_team(team).filter(allow_reads=False).values(
            "language_code")])
        return langs_set - tlp_allows_reads
            
            
    def for_team(self, team):
        return self.get_query_set().filter(team=team)

    def on_changed(cls, sender,  instance, *args, **kwargs):
        from teams.cache import invalidate_lang_preferences
        invalidate_lang_preferences(instance.team)

    def get_readable(self, team):
        from teams.cache import get_readable_langs
        return get_readable_langs(team)
        
    def get_writable(self, team):
        from teams.cache import get_writable_langs
        return get_writable_langs(team)
        
class TeamLanguagePreference(models.Model):
    """
    Represent language preferences for a given team. A team might say,
    for example that Yoruba translations do not translate a team, then
    that language should not have tasks assigned to it, nor it should
    allow roles to be narrowed to that language.

    This is how settings should interact, TLP means that we have created
    a TeamLanguagePreference for that team and language.
    | Action                                                  | NO TLP | allow_read=True,  | allow_read=False,  |
    |                                                         |        | allow_write=False | allow_write=False  |     
    =============================================================================================================
    | assignable as tasks                                     | X      |                   |                    |
    | assignable as narrowing to a certain team member / role | X      |                   |                    |
    | listed on the widget for viewing                        | X      | X                 |                    |
    | listed on the widget for improving                      | X      |                   |                    |
    | returned from the api read operations                   | X      | X                 |                    |
    | upload  / write operations from the api                 | X      |                   |                    |
    | show up on the start dialog                             | X      |                   |                    |

    Allow read = False and allow_writes = False essentially means that
    language is block for that team, while allow_write=False and
    allow_read=True means we can read subs but cannot write subs
    Allow_read=true and allow_write=true is invalid, just remove the row
    all together.
    """
    team = models.ForeignKey(Team, related_name="lang_preferences")
    language_code = models.CharField(max_length=16)
    allow_reads = models.BooleanField()
    allow_writes = models.BooleanField()

    objects = TeamLanguagePreferenceManager()
    
    def clean(self, *args, **kwargs):
        if self.allow_reads and self.allow_writes:
            raise ValidationError("No sense in having all allowed, just remove the preference for this language")
        super(TeamLanguagePreference, self).clean(*args, **kwargs)

    def __unicode__(self):
        return u"%s preference for team %s" % (self.language_code, self.team)

post_save.connect(TeamLanguagePreference.objects.on_changed, TeamLanguagePreference)        
