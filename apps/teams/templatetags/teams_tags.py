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

#  Based on: http://www.djangosnippets.org/snippets/73/
#
#  Modified by Sean Reifschneider to be smarter about surrounding page
#  link context.  For usage documentation see:
#
#     http://www.tummy.com/Community/Articles/django-pagination/
from django import template
from teams.models import Team, Invite, TeamVideo, Project, TeamMember
from videos.models import Action, Video
from apps.widget import video_cache
from django.conf import settings
from django.utils.translation import ugettext_lazy as _
from django.core.urlresolvers import reverse
from django.utils.http import urlquote
from widget.views import base_widget_params
from django.utils import simplejson as json
from django.utils.http import urlquote

from templatetag_sugar.register import tag
from templatetag_sugar.parser import Name, Variable, Constant, Optional, Model

from apps.teams.permissions import list_narrowings
from apps.teams.permissions import can_view_settings_tab as _can_view_settings_tab

DEV_OR_STAGING = getattr(settings, 'DEV', False) or getattr(settings, 'STAGING', False)
ACTIONS_ON_PAGE = getattr(settings, 'ACTIONS_ON_PAGE', 10)

ALL_LANGUAGES_DICT = dict(settings.ALL_LANGUAGES)

register = template.Library()

@register.filter
def can_approve_application(team, user):
    if not user.is_authenticated():
        return False
    return team.can_approve_application(user)

@register.filter
def can_invite_to_team(team, user):
    if not user.is_authenticated():
        return False
    return team.can_invite(user)

@register.filter
def can_add_video_to_team(team, user):
    return team.can_add_video(user)    

@register.filter
def can_edit_video(tv, user):
    return tv.can_edit(user) 

@register.filter
def can_remove_video(tv, user):
    return tv.can_remove(user) 

@register.filter
def is_team_manager(team, user):
    if not user.is_authenticated():
        return False
    return team.is_manager(user)

@register.filter
def is_team_member(team, user):
    if not user.is_authenticated():
        return False
    return team.is_member(user)

@register.inclusion_tag('teams/_team_select.html', takes_context=True)
def team_select(context, team):
    user = context['user']
    qs = Team.objects.exclude(pk=team.pk).filter(users=user)
    return {
        'team': team,
        'objects': qs,
        'can_create_team': DEV_OR_STAGING or (user.is_superuser and user.is_active)
    }

@register.inclusion_tag('teams/_team_activity.html', takes_context=True)    
def team_activity(context, team):
    from utils.orm import load_related_fk
    
    videos_ids = team.teamvideo_set.values_list('video_id', flat=True)
    action_qs = Action.objects.select_related('video', 'user', 'language', 'language__video').filter(video__pk__in=videos_ids)[:ACTIONS_ON_PAGE]

    context['videos_actions'] = action_qs
    
    return context

@register.inclusion_tag('teams/_team_add_video_select.html', takes_context=True)    
def team_add_video_select(context):
    request = context['request']
    
    #fix problem with encoding "?" in build_absolute_uri. It is not encoded,
    #so we get not same URL that page has
    location = request.get_full_path()
    context['video_absolute_url'] = request.build_absolute_uri(urlquote(location))
    
    user = context['user']
    if user.is_authenticated():
        qs = Team.objects.filter(users=user)
        context['teams'] = [item for item in qs if item.can_add_video(user)]
    return context 

@register.inclusion_tag('videos/_team_list.html')
def render_belongs_to_team_list(video):
    teams =  []
    for t in list(video.team_set.all()):
        if video.moderated_by == t:
            t.moderates =True
            teams.insert(0, t)
        else:
            teams.append(t)
    return {"teams": teams}


@register.inclusion_tag('teams/_team_video_detail.html', takes_context=True)  
def team_video_detail(context, team_video_search_record):
    context['search_record'] = team_video_search_record
    video_url = team_video_search_record.video_url
    context['team_video_widget_params'] = base_widget_params(context['request'], {
        'video_url': video_url, 
        'base_state': {},
        'effectiveVideoURL': video_url
    })
    return context

@register.inclusion_tag('teams/_complete_team_video_detail.html', takes_context=True)  
def complete_team_video_detail(context, team_video_search_record):
    context['search_record'] = team_video_search_record
    langs = team_video_search_record.video_completed_langs or ()
    urls = team_video_search_record.video_completed_lang_urls or ()
    context['display_languages'] = \
        zip([_(ALL_LANGUAGES_DICT[l]) for l in langs if bool(l)], urls)
    return context

@register.inclusion_tag('teams/_team_video_lang_detail.html', takes_context=True)  
def team_video_lang_detail(context, lang, team):
    #from utils.orm import load_related_fk
    
    context['team_video'] = team.teamvideo_set.select_related('video').get(video__id=lang.video_id)
    context['lang'] = lang
    return context

@register.inclusion_tag('teams/_invite_friends_to_team.html', takes_context=True)  
def invite_friends_to_team(context, team):
    context['invite_message'] = _(u'Can somebody help me subtitle these videos? %(url)s') % {
            'url': team.get_site_url()
        }
    return context

@register.inclusion_tag('teams/_team_video_lang_list.html', takes_context=True)  
def team_video_lang_list(context, model_or_search_record, max_items=6):
    """
    max_items: if there are more items than max_items, they will be truncated to X more.
    """
    
    if isinstance(model_or_search_record, TeamVideo):
        video_url = reverse("teams:team_video", kwargs={"team_video_pk":model_or_search_record.pk})
    elif isinstance(model_or_search_record, Video):
        video_url =  reverse("videos:video", kwargs={"video_id":model_or_search_record.video_id})
    else:
        video_url =  reverse("teams:team_video", kwargs={"team_video_pk":model_or_search_record.team_video_pk})
    return  {
        'sub_statuses': video_cache.get_video_languages_verbose(model_or_search_record.video_id, max_items),
        "video_url": video_url ,
        }

@register.inclusion_tag('teams/_team_video_in_progress_list.html')
def team_video_in_progress_list(team_video_search_record):
    langs_raw = video_cache.writelocked_langs(team_video_search_record.video_id)
    
    langs = [_(ALL_LANGUAGES_DICT[x]) for x in langs_raw]
    return  {
        'languages': langs
        }
    
@register.inclusion_tag('teams/_join_button.html', takes_context=True)
def render_team_join(context, team, button_size="huge"):
    context['team'] = team
    context['button_size'] = button_size
    return context

@register.inclusion_tag('teams/_leave_button.html', takes_context=True)
def render_team_leave(context, team, button_size="huge"):
    context['team'] = team
    context['button_size'] = button_size
    return context

@tag(register, [Variable(), Constant("as"), Name()])
def team_projects(context, team, varname):
    """
    Sets the project list on the context, but only the non default
    hidden projects.
    Usage:
    {%  team_projects team as projects %}
        {% for project in projects %}
            project
        {% endfor %}
    If you do want to loop through all project:

    {% for p in team.project_set.all %}
      {% if p.is_default_project %}
         blah
      {% else %}
    {%endif %}
    {% endfor %} 

    """
    context[varname] = Project.objects.for_team(team)
    return ""
    
@tag(register, [Variable(), Constant("as"), Name()])
def member_projects(context, member, varname):
    narrowings = list_narrowings(member.team, member.user, [Project])
    context[varname]   = narrowings['Project']
    return ""

    
@register.filter
def can_view_settings_tab(team, user):
   return _can_view_settings_tab(team, user)

@register.filter
def has_applicant(team, user):
    return team.applications.filter(user=user).exists()

def _team_members(team, role, countOnly):
    qs = team.members.filter(role=role) 
    if countOnly:
        qs = qs.count()
    return qs
    
@register.filter
def contributors(team, countOnly=False):
    return _team_members(team, TeamMember.ROLE_CONTRIBUTOR, countOnly)
    
@register.filter
def managers(team, countOnly=False):
    return _team_members(team, TeamMember.ROLE_MANAGER, countOnly)
    
    
@register.filter
def admins(team, countOnly=False):
    return _team_members(team, TeamMember.ROLE_ADMIN, countOnly)

    
@register.filter
def owners(team, countOnly=False):
    return _team_members(team, TeamMember.ROLE_OWNER, countOnly)

@register.filter
def members(team, countOnly=False):
    qs = team.members.all()
    if countOnly:
        qs = qs.count()
    return qs

    
