=======================
The permission system
=======================
Permissions are a combination of roles and narrowings.
- A team onwer can do anything.
- A team admin can do anything, but assign new admins. An admin can have
that role for a team or a project.
- A manager can do less, and can have it's priviledges attached to a teamd, 
a project or a language.
- A contributor can do less, and can have it's priviledges attached to a teamd,
a project or a language.

The list of permissions for each object can be seen on their models
(e.g. teams.models.Project)).
 
So any set of permissions can be assigned to an entire team, on a project
or a specific language. These are called narrowings. If a user has a permission
team wise, he will end up with a MembershipNarrowing: content team set for that TeamMember
 
What the permission checking done is:
- if owner: can do anything
- Else will check if the permission has narrowing, for team, project then lang 
 
There is a performance hit. In the worst case scenario.
we're running three checks instead of 1. This is fine, because we
are only checking things this way on data writing operations which are a
minority of traffic.

teams.permissions 
=================
Most of the business logic for permissions.

.. automodule:: unisubs.apps.teams.permissions
    
teams.permissions_const    
===========================
Is a somewhat declarative approach to what is allowed
and how rules interact. This is on a stand alone module to avoid issues
with circular dependencies on imports.

.. automodule:: unisubs.apps.teams.permissions_const
