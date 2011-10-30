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
"""
 Permissions are a combination of roles and narrowings.
 A team onwer can do anything.
 A team admin can do anything, but assign new admins. An admin can have
 that role for a team or a project.
 A manager can do less, and can have it's priviledges attached to a teamd,
 a project or a language.
 A contribuitor can do less, and can have it's priviledges attached to a teamd,
 a project or a language.

 The list of permissions for each object can be seen on their models
 (e.g. teams.models.Project)).
 So any set of permissions can be assigned to an entire team, on a project
 or a specific language. These are called narrowings. If a user has a permission
 team wise, he will end up with a MembershipNarrowing: content team set for that TeamMember
 So basically, what the permission checking done is:
 - if owner: can do anything
 - Else will check if the permission has narrowing, for team, project then alng 
 What this means is there is a performance hit. In the worst case cenario
 we're running three checks instead of 1. This is fine, because we
 are only checking things this way on data writing operations which are a
 minority of traffic.

teams.permissions_const -> Is a somewhat declarative approach to what is allowed
and how rules interact. This is on a stand alone module to avoid issues
with circular dependencies on imports.

teams.permissions -> Most of the business logic for permissions.

"""
#: All available permissions
RENAME_TEAM_PERM =  ("rename_team", "Rename team",) 
EDIT_TEAM_SETTINGS_PERM = ("edit_team_settings", "Edit team settings",)
EDIT_PROJECT_SETTINGS_PERM = ("edit_project_settings", "Edit project settings",)
ASSIGN_ROLE_PERM = ("assign_roles", "Assign Roles",)
ASSIGN_TASKS_PERM = ("assign_tasks", "Assign Tasks",)
ADD_VIDEOS_PERM = ("add_videos", "Add videos",)
EDIT_VIDEO_SETTINGS_PERM = ("edit_video_settings", "Edit video settings",)
MESSAGE_ALL_MEMBERS_PERM  = ("message_all_members", "Message all members",)
ACCEPT_ASSIGNMENT_PERM = ("accept_assignment", "Accept assignment")
PERFORM_MANAGER_REVIEW_PERM = ("perform_manager_review", "Perform manager review")
PERFORM_PEER_REVIEW_PERM = ("perform_peer_review", "Perform peer review")
EDIT_SUBS_PERM = ("edit_subs", "Edit subs")

#: All roles
ROLE_ADMIN = "admin"
ROLE_OWNER = 'owner'
ROLE_MANAGER = 'manager'
ROLE_CONTRIBUTOR = 'contribuitor'

    
TEAM_PERMISSIONS = (
    RENAME_TEAM_PERM,
    EDIT_TEAM_SETTINGS_PERM ,
    EDIT_PROJECT_SETTINGS_PERM,
    ASSIGN_ROLE_PERM, 
    ASSIGN_TASKS_PERM ,
    ADD_VIDEOS_PERM ,
    EDIT_VIDEO_SETTINGS_PERM ,
    MESSAGE_ALL_MEMBERS_PERM , 
    ACCEPT_ASSIGNMENT_PERM , 
    PERFORM_MANAGER_REVIEW_PERM, 
    PERFORM_PEER_REVIEW_PERM, 
    EDIT_SUBS_PERM,
)   

PROJECT_PERMISSIONS = (
    ASSIGN_ROLE_PERM, 
    ASSIGN_TASKS_PERM ,
    ADD_VIDEOS_PERM ,
    EDIT_VIDEO_SETTINGS_PERM ,
    ACCEPT_ASSIGNMENT_PERM , 
    PERFORM_MANAGER_REVIEW_PERM, 
    PERFORM_PEER_REVIEW_PERM, 
    EDIT_SUBS_PERM,
    MESSAGE_ALL_MEMBERS_PERM , 
)

LANG_PERMISSIONS =  (
    ASSIGN_TASKS_PERM ,
    ADD_VIDEOS_PERM ,
    EDIT_VIDEO_SETTINGS_PERM ,
    ACCEPT_ASSIGNMENT_PERM , 
    PERFORM_MANAGER_REVIEW_PERM, 
    PERFORM_PEER_REVIEW_PERM, 
    EDIT_SUBS_PERM ,
)



RULES = {}
RULES[ROLE_OWNER] = set(TEAM_PERMISSIONS)        
RULES[ROLE_ADMIN] = set((
    EDIT_TEAM_SETTINGS_PERM,
    EDIT_PROJECT_SETTINGS_PERM ,
    ASSIGN_ROLE_PERM,
    ASSIGN_TASKS_PERM,
    ADD_VIDEOS_PERM ,
    EDIT_VIDEO_SETTINGS_PERM,
    MESSAGE_ALL_MEMBERS_PERM , 
    ACCEPT_ASSIGNMENT_PERM ,
    PERFORM_MANAGER_REVIEW_PERM ,
    PERFORM_PEER_REVIEW_PERM,
))


RULES[ROLE_MANAGER] = set((
    ASSIGN_TASKS_PERM,
    ADD_VIDEOS_PERM ,
    EDIT_VIDEO_SETTINGS_PERM,
    PERFORM_MANAGER_REVIEW_PERM ,
    PERFORM_PEER_REVIEW_PERM,
    ACCEPT_ASSIGNMENT_PERM ,
 ))

RULES[ROLE_CONTRIBUTOR] =  set((
    ACCEPT_ASSIGNMENT_PERM ,
    PERFORM_PEER_REVIEW_PERM,
 ))

ROLES_ORDER = [ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER, ROLE_CONTRIBUTOR]

