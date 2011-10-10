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
from teams.models import Team, TeamMember, Application, Workflow, Project, TeamVideo, Task
from auth.models import CustomUser as User

from django.shortcuts import get_object_or_404

from django.utils.translation import ugettext as _
from django.forms.models import model_to_dict
from utils.rpc import Error, Msg
from utils.rpc import RpcRouter
from utils.translation import SUPPORTED_LANGUAGES_DICT

from icanhaz.projects_decorators import raise_forbidden_project
from icanhaz.projects import can_edit_project
from teams.models import Team, TeamMember, Application, Project
from teams.forms import TaskAssignForm, TaskDeleteForm
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
    d  = model_to_dict(p, fields=["name", "slug", "order", "description", "pk"])
    d.update({"pk":p.pk})
    return d
    
    
class TeamsApiV2Class(object):
    def test_api(self, message, user):
        return Msg(u'Received message: "%s" from user "%s"' % (message, unicode(user)))



    def tasks_languages_list(self, team_slug, user):
        languages = filter(None, Task.objects.filter(team__slug=team_slug,
                                                     deleted=False)
                                 .values_list('language', flat=True)
                                 .distinct())

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
        tasks = Task.objects.filter(team__slug=team_slug, deleted=False)

        if 'type' in filters:
            tasks = tasks.filter(type=Task.TYPE_IDS[filters['type']])
        if 'completed' in filters:
            tasks = tasks.filter(completed__isnull=not filters['completed'])
        if 'assignee' in filters:
            tasks = tasks.filter(assignee=filters['assignee'])
        if 'team_video' in filters:
            tasks = tasks.filter(team_video=filters['team_video'])
        if 'language' in filters and filters['language']:
            tasks = tasks.filter(language=filters['language'])

        return [t.to_dict() for t in tasks]

    def task_assign(self, task_id, assignee_id, user):
        '''Assign a task to the given user, or unassign it if given null/None.'''

        form = TaskAssignForm(user, data={'task': task_id, 'assignee': assignee_id})
        if form.is_valid():
            task = Task.objects.get(pk=task_id)
            assignee = User.objects.get(pk=assignee_id) if assignee_id else None

            task.assignee = assignee
            task.save()

            return task.to_dict()
        else:
            return { 'success': False, 'errors': form.errors }

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
        tv = TeamVideo.objects.get(pk=team_video_id)
        task, created = Task.objects.get_or_create(team=tv.team, team_video=tv,
                language=language, type=Task.TYPE_IDS['Translate'])
        assignee = User.objects.get(pk=assignee_id) if assignee_id else None

        task.assignee = assignee
        task.save()

        return task.to_dict()

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

        setattr(workflow, 'perm_%s' % step, Workflow.PERM_IDS[perm])
        workflow.save()

        return workflow.to_dict()



    def project_list(self, team_slug,  project_pk, user):
        team, project = _user_can_edit_project(team_slug, project_pk, user)
        project_objs = []
        for p in Project.objects.for_team(team):
            project_objs.append(_project_to_dict(p))
        return project_objs

    def project_edit(self, team_slug, project_pk, name,
                     slug, description, order, user):
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
                


TeamsApiV2 = TeamsApiV2Class()

rpc_router = RpcRouter('teams:rpc_router', {
    'TeamsApi': TeamsApi,
    'TeamsApiV2': TeamsApiV2,
})
