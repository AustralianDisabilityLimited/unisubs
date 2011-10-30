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
# minority of traffic.


from django.contrib.contenttypes.models import ContentType
from django.utils.functional import  wraps
from guardian.shortcuts import assign, remove_perm, get_objects_for_user

from teams.permissions_const import TEAM_PERMISSIONS, PROJECT_PERMISSIONS, \
      LANG_PERMISSIONS,   EDIT_TEAM_SETTINGS_PERM , \
EDIT_PROJECT_SETTINGS_PERM , ASSIGN_ROLE_PERM , ASSIGN_TASKS_PERM , \
ADD_VIDEOS_PERM , EDIT_VIDEO_SETTINGS_PERM , MESSAGE_ALL_MEMBERS_PERM  , \
ACCEPT_ASSIGNMENT_PERM , PERFORM_MANAGER_REVIEW_PERM , \
PERFORM_PEER_REVIEW_PERM  , EDIT_SUBS_PERM, RULES,\
ROLES_ORDER, ROLE_OWNER, ROLE_MANAGER, ROLE_CONTRIBUTOR, ROLE_ADMIN

from teams.models import MembershipNarrowing, Team

def can_rename_team(team, user):
    return team.is_owner(user)

    
def _passes_test(team, user, project, lang, perm_name):
    if isinstance(perm_name, tuple):
        perm_name = perm_name[0]
    member = team.members.get(user=user)
    if member.role == ROLE_OWNER:
        # short circuit logic for onwers, as they can do anything
        return True
    # first we check if this role has (withouth narrowning)
    # the permission asked. E.g. contribuitor cannot rename
    # a team

    for model in [x for x in (team, project, lang) if x]:
        if model_has_permission(member, perm_name, model) is False:
            continue 
        from teams.models import MembershipNarrowing
        if MembershipNarrowing.objects.for_type(model).filter(member=member).exists():
            return True
    
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
    roles_for_user = set([x.role for x in team.members.filter(user=user)])
    higer_role = ROLES_ORDER[max([ROLES_ORDER.index(x) for x in roles_for_user ])]
        
    return _perms_equal_or_lower(higer_role)
    
def can_assign_roles(team, user, project=None, lang=None,  role=None):
    """
    Checks if the user can generally assing roles for that model
    (team or project or lang), but also that he can only assign 'lesser'
    roles than his own.
    """
    member = team.members.get(user=user)
    # only owner can assing owner role!
    if member.role == ROLE_OWNER:
        return True
    elif  role == ROLE_OWNER:
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
    
def can_add_video(team, user, project=None, lang=None):
    if not team.video_policy :
        return True
    return _passes_test(team, user, project, lang, ADD_VIDEOS_PERM)

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

                               
def model_has_permission(member, perm_name, model):
    return perm_name in _perms_for(member.role, model)
                               
def _perms_for(role, model):
    return [x[0] for x in RULES[role].\
            intersection(model._meta.permissions)]
    
def add_role(team, cuser, added_by,  role, project=None, lang=None):
    from teams.models import TeamMember
    member, created = TeamMember.objects.get_or_create(
        user=cuser,team=team, defaults={'role':role})
    member.role = role
    member.save()
    narrowing = lang or project or team
    add_narrowing_to_member(member, narrowing, added_by)
    return member 

def remove_role(team, user, role, project=None, lang=None):
    role = role or ROLE_CONTRIBUTOR
    team.members.filter(user=user, role=role).delete()


def add_narrowing_to_member(member, narrowing, added_by):
    """
    If adding any a narrowing one must remove any Team objects
    that will allow an user to execute actions on anything
    withing that team
    """
    if not isinstance(narrowing, Team):
       MembershipNarrowing.objects.for_type(Team).filter(member=member).delete()
    return MembershipNarrowing.objects.create(member, narrowing, added_by)
    
def add_narrowing(team, user, narrowing, added_by):
    return add_narrowing_to_member(team.members.get(user=user), narrowing. added_by)


def remove_narrowings(team, user, narrowings):
    try:
        iter(narrowings)
    except TypeError:
        narrowings = [narrowings]
    member = team.members.get(user=user)
    [MembershipNarrowing.objects.get(
        object_pk=x.pk,
        content_type=ContentType.objects.get_for_model(x),
        member=member) for x in narrowings]
    
         
def list_narrowings(team, user, models):
   data = {}
   for model in models:
       data[model._meta.object_name] = \
           MembershipNarrowing.objects.for_type(model).filter(
               member=team.members.get(user=user))
   return data    
    

