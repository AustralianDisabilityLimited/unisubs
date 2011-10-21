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

from collections import defaultdict
from auth.models import CustomUser as User
from teams.models import Team, TeamMember, Application, Workflow, Project, TeamVideo, Task, Setting
from videos.models import SubtitleLanguage

from django.shortcuts import get_object_or_404

from django.core.urlresolvers import reverse
from django.utils.translation import ugettext as _
from django.forms.models import model_to_dict
from utils.rpc import Error, Msg, RpcRouter
from utils.forms import flatten_errorlists
from utils.translation import SUPPORTED_LANGUAGES_DICT

from icanhaz.projects_decorators import raise_forbidden_project
from icanhaz.projects import can_edit_project
from teams.forms import TaskAssignForm, TaskDeleteForm, GuidelinesMessagesForm, SettingsForm, WorkflowForm
from teams.project_forms import ProjectForm

class TeamsApiClass(object):

    def create_application(self, team_id, msg, user):
        if not user.is_authenticated():
            return Error(_('You should be authenticated.'))

        try:
            if not team_id:
                raise Team.DoesNotExist
            team = Team.objects.get(pk=team_id)
        except Team.DoesNotExist:
            return Error(_('Team does not exist'))

        try:
            TeamMember.objects.get(team=team, user=user)
            return Error(_(u'You are already a member of this team.'))
        except TeamMember.DoesNotExist:
            pass

        if team.is_open():
            TeamMember(team=team, user=user).save()
            return Msg(_(u'You are now a member of this team because it is open.'))
        elif team.is_by_application():
            application, created = Application.objects.get_or_create(team=team, user=user)
            application.note = msg
            application.save()
            return Msg(_(u'Application sent success. Wait for answer from team.'))
        else:
            return Error(_(u'You can\'t join this team by application.'))

    def promote_user(self, team_id, member_id, role, user):
        try:
            team = Team.objects.for_user(user).get(pk=team_id)
        except Team.DoesNotExist:
            return Error(_(u'Team does not exist.'))

        if not team.is_manager(user):
            return Error(_(u'You are not manager of this team.'))

        if not role in dict(TeamMember.ROLES):
            return Error(_(u'Incorrect team member role.'))

        try:
            tm = TeamMember.objects.get(pk=member_id, team=team)
        except TeamMember.DoesNotExist:
            return Error(_(u'Team member does not exist.'))

        if tm.user == user:
            return Error(_(u'You can\'t promote yourself.'))

        tm.role = role
        tm.save()
        return Msg(_(u'Team member role changed.'))

TeamsApi = TeamsApiClass()


def _user_can_edit_project(team_slug, project_pk, user):
    """
    Ideally we could use the decorator at projects_decorators,
    but since the magic rpc already messes with the argument order
    and namins, we'd end up using args and kwargs, therefore loosing
    all the fun. damn rpc.
    """
    team = get_object_or_404(Team, slug=team_slug)
    project = None
    if project_pk is not None:
        project = get_object_or_404(Project, team=team, pk=project_pk)

    if not can_edit_project(user, team, project):
        return raise_forbidden_project(request)
    return team, project

def _project_to_dict(p):
    d  = model_to_dict(p, fields=["name", "slug", "order", "description", "pk", "workflow_enabled"])
    d.update({
        "pk":p.pk,
        "url": reverse("teams:project_video_list", kwargs={
            "slug":p.team.slug,
            "project_slug": p.slug,
        })
    })
    return d


def _build_translation_task_dict(team, team_video, language, member):
    task_dict = Task(team=team, team_video=team_video,
                     type=Task.TYPE_IDS['Translate'], assignee=None,
                     language=language).to_dict(member)
    task_dict['ghost'] = True
    return task_dict

def _translation_task_needed(tasks, team_video, language):
    '''Return True if a translation task for the language needs to be added to the list.'''

    result = False

    video_tasks = [t for t in tasks if t.team_video == team_video]
    for task in video_tasks:
        if task.type == Task.TYPE_IDS['Subtitle']:
            if not task.completed:
                # There's an incomplete subtitling task, so we don't need to
                # return a ghost (yet).
                return False
            else:
                # If there's a *complete* subtitling task we *may* need to
                # return a ghost (if there isn't already one there).
                result = True

    videolanguage_tasks = [t for t in video_tasks if t.language == language]
    for task in videolanguage_tasks:
        if task.type in (Task.TYPE_IDS['Translate'], Task.TYPE_IDS['Review'], Task.TYPE_IDS['Approve']):
            # There is already a translation task or a task later in the
            # process in the DB for this video/language combination.
            # No need to return a ghost.
            return False

    return result

def _get_completed_language_dict(team_videos, languages):
    '''Return a dict of video IDs to languages complete for each video.

    This is created all at once so we can use only one query to look the
    information up, instead of using a separate one for each video later when
    we're going through them.

    '''
    video_ids = [tv.video.id for tv in team_videos]

    completed_langs = SubtitleLanguage.objects.filter(
            video__in=video_ids, language__in=languages, is_complete=True
    ).values_list('video', 'language')

    completed_languages = defaultdict(list)

    for video_id, lang in completed_langs:
        completed_languages[video_id].append(lang)

    return completed_languages

def _get_translation_tasks(team, tasks, member, team_video, language):
    # TODO: Once this is a setting, look it up.
    languages = [language] if language else ['fr', 'es', 'tl']
    languages = map(str, languages)

    team_videos = [team_video] if team_video else team.teamvideo_set.all()
    completed_languages = _get_completed_language_dict(team_videos, languages)

    return [_build_translation_task_dict(team, team_video, language, member)
            for language in languages
            for team_video in team_videos
            if _translation_task_needed(tasks, team_video, language)
            and language not in completed_languages[team_video.video.pk]]

def _ghost_tasks(team, tasks, filters, member):
    '''Return a list of "ghost" tasks for the given team.

    Ghost tasks are tasks that don't exist in the database, but should be shown
    to the user anyway.

    '''
    type = filters.get('type')
    should_add = (                           # Add the ghost translation tasks iff:
        ((not type) or type == u'Translate') # We care about translation tasks
        and not filters.get('completed')     # We care about incomplete tasks
        and not filters.get('assignee')      # We care about unassigned tasks
    )

    if should_add:
        return _get_translation_tasks(team, tasks, member,
                                      filters.get('team_video'),
                                      filters.get('language'))
    else:
        return []

def _get_or_create_workflow(team_slug, project_id, team_video_id):
    try:
        workflow = Workflow.objects.get(team__slug=team_slug, project=project_id,
                                        team_video=team_video_id)
    except Workflow.DoesNotExist:
        # We special case this because Django won't let us create new models
        # with the IDs, we need to actually pass in the Model objects for
        # the ForeignKey fields.
        #
        # Most of the time we won't need to do these three extra queries.

        team = Team.objects.get(slug=team_slug)
        project = Project.objects.get(pk=project_id) if project_id else None
        team_video = TeamVideo.objects.get(pk=team_video_id) if team_video_id else None

        workflow = Workflow(team=team, project=project, team_video=team_video)

    return workflow


class TeamsApiV2Class(object):
    def test_api(self, message, user):
        return Msg(u'Received message: "%s" from user "%s"' % (message, unicode(user)))


    # Basic Settings
    def team_get(self, team_slug, user):
        return Team.objects.get(slug=team_slug).to_dict()

    def team_set(self, team_slug, data, user):
        team = Team.objects.get(slug=team_slug)

        form = SettingsForm(data, instance=team)
        if form.is_valid():
            form.save()
            return team.to_dict()
        else:
            return Error(_(u'\n'.join(flatten_errorlists(form.errors))))


    # Tasks
    def tasks_languages_list(self, team_slug, user):
        languages = filter(None, Task.objects.filter(team__slug=team_slug,
                                                     deleted=False)
                                 .values_list('language', flat=True)
                                 .distinct())

        # TODO: Handle the team language setting here once team settings are
        # implemented.
        languages += ['fr', 'es', 'tl']
        languages = list(set(languages))

        return [{'language': l,
                 'language_display': SUPPORTED_LANGUAGES_DICT[l]}
                for l in languages]


    def tasks_list(self, team_slug, filters, user):
        '''List tasks for the given team, optionally filtered.

        `filters` should be an object/dict with zero or more of the following keys:

        * type: a string describing the type of task. 'Subtitle', 'Translate', etc.
        * completed: true or false
        * assignee: user ID as an integer
        * team_video: team video ID as an integer

        '''
        team = Team.objects.get(slug=team_slug)
        tasks = Task.objects.filter(team=team, deleted=False)
        member = Team.objects.get(slug=team_slug).members.get(user=user)

        if filters.get('assignee'):
            tasks = tasks.filter(assignee=filters['assignee'])
        if filters.get('team_video'):
            tasks = tasks.filter(team_video=filters['team_video'])

        # Force the main query here for performance.  This way we can manipulate
        # the list in-memory instead of making several more calls to the DB
        # below.
        tasks = list(tasks)
        real_tasks = tasks

        # We have to run most of the filtering after the main task list is
        # created, because if we do it beforehand some of the tasks needed to
        # determine which ghost tasks to show may be excluded.
        if not filters.get('completed'):
            real_tasks = [t for t in real_tasks if not t.completed]
        if filters.get('language'):
            real_tasks = [t for t in real_tasks if t.language == filters['language']]
        if filters.get('type'):
            real_tasks = [t for t in real_tasks if t.type == Task.TYPE_IDS[filters['type']]]

        real_tasks = [t.to_dict(member) for t in real_tasks]
        ghost_tasks = _ghost_tasks(team, tasks, filters, member)

        return real_tasks + ghost_tasks


    def task_assign(self, task_id, assignee_id, user):
        '''Assign a task to the given user, or unassign it if null/None.'''
        task = Task.objects.get(pk=task_id)
        member = task.team.members.get(user=user)

        form = TaskAssignForm(task.team, member,
                    data={'task': task_id, 'assignee': assignee_id})
        if form.is_valid():
            assignee = User.objects.get(pk=assignee_id) if assignee_id else None

            task.assignee = assignee
            task.save()

            return task.to_dict(member)
        else:
            return Error(_(u'\n'.join(flatten_errorlists(form.errors))))

    def task_delete(self, task_id, user):
        '''Mark a task as deleted.

        The task will not be physically deleted from the database, but will be
        flagged and won't appear in further task listings.

        '''

        form = TaskDeleteForm(user, data={'task': task_id})
        if form.is_valid():
            task = Task.objects.get(pk=task_id)

            task.deleted = True
            task.save()

            return task.to_dict()
        else:
            return { 'success': False, 'errors': form.errors }


    def task_translate_assign(self, team_video_id, language, assignee_id, user):
        '''Assign a translation task to the given user, or unassign it if given null/None.

        This is special-cased from the normal assignment function because we
        don't create translation tasks in advance -- it would be too wasteful.
        The translation task will be created if it does not already exist.

        '''
        # TODO: Check permissions here.
        tv = TeamVideo.objects.get(pk=team_video_id)
        task, created = Task.objects.get_or_create(team=tv.team, team_video=tv,
                language=language, type=Task.TYPE_IDS['Translate'])
        assignee = User.objects.get(pk=assignee_id) if assignee_id else None

        task.assignee = assignee
        task.save()
        member = task.team.members.get(user=user)

        return task.to_dict(member)

    def task_translate_delete(self, team_video_id, language, user):
        '''Mark a translation task as deleted.

        This is special-cased from the normal delete function because we don't
        create translation tasks in advance -- it would be too wasteful.  The
        translation task will be created if it does not already exist.

        The task will not be physically deleted from the database, but will be
        flagged and won't appear in further task listings.

        '''
        tv = TeamVideo.objects.get(pk=team_video_id)
        task, created = Task.objects.get_or_create(team=tv.team, team_video=tv,
                language=language, type=Task.TYPE_IDS['Translate'])

        task.deleted = True
        task.save()

        return task.to_dict()


    # Workflows
    def workflow_get(self, team_slug, project_id, team_video_id, user):
        if team_video_id:
            target_id, target_type = team_video_id, 'team_video'
        elif project_id:
            target_id, target_type = project_id, 'project'
        else:
            team = Team.objects.get(slug=team_slug)
            target_id, target_type = team.id, 'team'

        return Workflow.get_for_target(target_id, target_type).to_dict()

    def workflow_set_step(self, team_slug, project_id, team_video_id, step, perm, user):
        workflow = _get_or_create_workflow(team_slug, project_id, team_video_id)
        setattr(workflow, 'perm_%s' % step, Workflow.PERM_IDS[perm])
        workflow.save()

        return workflow.to_dict()

    def workflow_set(self, team_slug, project_id, team_video_id, data, user):
        workflow = _get_or_create_workflow(team_slug, project_id, team_video_id)

        form = WorkflowForm(data, instance=workflow)
        if form.is_valid():
            form.save()
            return workflow.to_dict()
        else:
            print form.errors
            return Error(_(u'\n'.join(flatten_errorlists(form.errors))))


    # Projects
    def project_list(self, team_slug,  project_pk, user):
        team, project = _user_can_edit_project(team_slug, project_pk, user)
        project_objs = []
        for p in Project.objects.for_team(team):
            project_objs.append(_project_to_dict(p))
        return project_objs

    def project_edit(self, team_slug, project_pk, name,
                     slug, description, order, workflow_enabled, user):
        team, project = _user_can_edit_project(team_slug, project_pk, user)
        # insert a new project as the last one
        if bool(order):
            num_projects = team.project_set.exclude(pk=project_pk).count()
            order = num_projects    
        form = ProjectForm(instance=project, data=dict(
            name=name, 
            description=description,
            slug=slug, 
            pk=project and project.pk,
            order=order,
            workflow_enabled=workflow_enabled,
                ))
        if form.is_valid():
            p = form.save(commit=False)
            p.team = team
            p.save()
            return dict(
                success = True,
                msg = _("The project %s has been saved" % (p.name)),
                obj = _project_to_dict(p)
            )
        else:
             return dict(
                 success=False,
                 msg = "Please correct the errors bellow",
                 errors = form.errors
                 )   

    def project_delete(self, team_slug, project_pk, user):        
        team, project = _user_can_edit_project(team_slug, project_pk, user)
        videos_affected = project.teamvideo_set.all().update(project=team.default_project)
        project.delete()
        return dict(
            videos_affected = videos_affected,
            success=True,
            msg="Project %s has been deleted" % project.name,
            isRemoval=True
        )


    # Guidelines and messages
    def guidelines_get(self, team_slug, user):
        team = Team.objects.get(slug=team_slug)
        return [{'key': s.key_name, 'data': s.data}
                for s in team.settings.messages_guidelines()]

    def guidelines_set(self, team_slug, data, user):
        team = Team.objects.get(slug=team_slug)

        form = GuidelinesMessagesForm(data)
        if form.is_valid():
            for key, val in form.cleaned_data.items():
                setting, created = Setting.objects.get_or_create(
                        team=team, key=Setting.KEY_IDS[key])
                setting.data = val
                setting.save()

            return {}
        else:
            return Error(_(u'\n'.join(flatten_errorlists(form.errors))))


TeamsApiV2 = TeamsApiV2Class()

rpc_router = RpcRouter('teams:rpc_router', {
    'TeamsApi': TeamsApi,
    'TeamsApiV2': TeamsApiV2,
})
