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

# The team permission is a combination of roles and objects.
# A tean onwer can do anything.
# A team admin can do anything, but assign new admins. An admin can have
# that role for a team or a project.
# A manager can do less, and can have it's priviledges attached to a teamd,
# a project or a language.
# A contribuitor can do less, and can have it's priviledges attached to a teamd,
# a project or a language.
# The list of permissions for each object can be seen on their models
# (e.g. teams.models.Project)).
# So basically, what the permission checking done is:
# - if owner: can do anything
# - Else will check if user has specific permission for team, or project or lang.
# What this means is there is a performance hit. In the worst case cenario
# we're running three checks instead of 1. This is fine, because we
# are only checking things this way on data writing operations which are a
# minirity of traffic.

from django.utils.functional import  wraps
from guardian.shortcuts import assign, remove_perm, get_objects_for_user

from teams.permissions_const import TEAM_PERMISSIONS_RAW, PROJECT_PERMISSIONS_RAW, \
      LANG_PERMISSIONS_RAW, _prepare_perms_tuples,  EDIT_TEAM_SETTINGS_PERM , \
EDIT_PROJECT_SETTINGS_PERM , ASSIGN_ROLE_PERM , ASSIGN_TASKS_PERM , \
ADD_VIDEOS_PERM , EDIT_VIDEO_SETTINGS_PERM , MESSAGE_ALL_MEMBERS_PERM  , \
ACCEPT_ASSIGNMENT_PERM , PERFORM_MANAGER_REVIEW_PERM , \
PERFORM_PEER_REVIEW_PERM  , EDIT_SUBS_PERM, _normalized_perm_name, RULES,\
ROLES_ORDER, ROLE_OWNER, ROLE_MANAGER, ROLE_CONTRIBUTOR, ROLE_ADMIN

def can_rename_team(team, user):
    return team.is_owner(user)

def _passes_test(team, user, project, lang, perm_name):
    
    target = lang or project or team
    perm_name = _normalized_perm_name(perm_name[0], target)
    
    if  _owner(team, user):
                return True
    return user.has_perm(perm_name, team) or \
           user.has_perm(perm_name, project) or \
           user.has_perm(perm_name, lang)
    return False
    
def _check_perms( perm_name,):
    def wrapper(func):
        def wrapped(team, user, project=None, lang=None, video=None):
            return _passes_test(team, user, project, lang, perm_name)
        return wraps(func)(wrapped)
    return wrapper
            
def _is_owner(func):
    def wrapper(team, user, *args, **kwargs):
        if team.members.filter(
            user=user,
            role = ROLE_OWNER).exists():
            return True
        return func(team, user, *args, **kwargs)
    return wraps(func)(wrapper)
        
def _owner(team, user):
    from teams.models import TeamMember
    return  team.members.filter(
        user=user,
        role = TeamMember.ROLE_OWNER).exists()

@_check_perms(EDIT_TEAM_SETTINGS_PERM)
def can_change_team_settings(team, user, project=None, lang=None, role=None) :
    return False

def _perms_equal_or_lower(role):
    return ROLES_ORDER[ROLES_ORDER.index(role):]

def roles_assignable_to(team, user, project=None, lang=None):
    target = lang or project or team
    roles_for_user = set([x.role for x in team.members.filter(user=user)])
    higer_role = ROLES_ORDER[max([ROLES_ORDER.index(x) for x in roles_for_user ])]
        
    return _perms_equal_or_lower(higer_role)
    
def can_assign_roles(team, user, project=None, lang=None,  role=None):
    from teams.models import TeamMember
    # only owner can assing owner role!
    is_owner = team.members.filter(
            user=user,
            role = ROLE_OWNER).exists()
    if is_owner:
        return True
    elif  role == TeamMember.ROLE_OWNER:
        return False
    can_do =  _passes_test(team, user, project, lang, ASSIGN_ROLE_PERM)    
    if can_do:
        # makes sure we allow only <= new roles assignment, e.g
        # a project owner can assign any other role, but a manager
        # cannot assign admins nor owners
        return role in roles_assignable_to(team, user,project, lang)
    return False


@_check_perms(ASSIGN_TASKS_PERM)
def can_assign_taks(team, user, project=None, lang=None):
    pass
    
@_check_perms(ADD_VIDEOS_PERM)
def can_add_video(team, user, project, lang=None):
    pass

@_check_perms(EDIT_VIDEO_SETTINGS_PERM)
def can_change_video_settings(team, user, project, lang):
    pass

@_check_perms(MESSAGE_ALL_MEMBERS_PERM)
def can_message_all_members(team, user, project, lang=None):
    pass

@_check_perms(ACCEPT_ASSIGNMENT_PERM)
def can_accept_assignments(team, user, project=None, lang=None):
    pass

@_check_perms(PERFORM_MANAGER_REVIEW_PERM)
def can_manager_review(team, user, project=None, lang=None):
    pass

@_check_perms(PERFORM_PEER_REVIEW_PERM)
def can_peer_review(team, user, project=None, lang=None):
    pass

@_check_perms(EDIT_SUBS_PERM)    
def can_edit_subs_for(team, user, project=None, lang=None):
    pass

def _perms_for(role, model):
    return [x[0] for x in RULES[role].\
            intersection(model._meta.permissions)]
    
def add_role(team, cuser, project=None, lang=None, role=None):
    from teams.models import TeamMember

    target = lang or project or team
    
    print "roles %s%s, can -> %s" % (role, target, _perms_for(role, target))
    
    
    [ assign(p, cuser.user_ptr, target) for p in _perms_for(role, target)]
    member, created = TeamMember.objects.get_or_create(
        user=cuser,team=team, role=role)
    return member 

def remove_role(team, user, project=None, lang=None,
                role=None):
    from teams.models import TeamMember

    role = role or TeamMember.ROLE_CONTRIBUTOR
    team.members.filter(user=user, role=role).delete()
    target = lang or project or team
    [remove_perm(p, user, target) for p in _perms_for(role, target)]
