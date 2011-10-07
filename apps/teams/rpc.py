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
from django.utils.translation import ugettext as _
from utils.rpc import Error, Msg
from utils.rpc import RpcRouter

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


class TeamsApiV2Class(object):
    def test_api(self, message, user):
        return Msg(u'Received message: "%s" from user "%s"' % (message, unicode(user)))


    def tasks_list(self, team_id, filters, user):
        tasks = Task.objects.filter(team=team_id, deleted=False)

        if 'type' in filters:
            tasks = tasks.filter(type=Task.TYPE_IDS[filters['type']])
        if 'completed' in filters:
            tasks = tasks.filter(completed__isnull=not filters['completed'])
        if 'assignee' in filters:
            tasks = tasks.filter(assignee=filters['assignee'])
        if 'team_video' in filters:
            tasks = tasks.filter(team_video=filters['team_video'])

        return {'tasks': [t.to_dict() for t in tasks]}

    def task_assign(self, task_id, assignee_id, user):
        task = Task.objects.get(pk=task_id)
        assignee = User.objects.get(pk=assignee_id) if assignee_id else None

        task.assignee = assignee
        task.save()

        return task.to_dict()

    def task_delete(self, task_id, user):
        task = Task.objects.get(pk=task_id)

        task.deleted = True
        task.save()

        return task.to_dict()


    def workflow_get(self, team_id, project_id, team_video_id, user):
        if team_video_id:
            target_id, target_type = team_video_id, 'team_video'
        elif project_id:
            target_id, target_type = project_id, 'project'
        else:
            target_id, target_type = team_id, 'team'

        return Workflow.get_for_target(target_id, target_type).to_dict()

    def workflow_set_step(self, team_id, project_id, team_video_id, step, perm, user):
        try:
            workflow = Workflow.objects.get(team=team_id, project=project_id,
                                            team_video=team_video_id)
        except Workflow.DoesNotExist:
            # We special case this because Django won't let us create new models
            # with the IDs, we need to actually pass in the Model objects for
            # the ForeignKey fields.
            #
            # Most of the time we won't need to do these three extra queries.

            team = Team.objects.get(pk=team_id)
            project = Project.objects.get(pk=project_id) if project_id else None
            team_video = TeamVideo.objects.get(pk=team_video_id) if team_video_id else None

            workflow = Workflow(team=team, project=project, team_video=team_video)

        setattr(workflow, 'perm_%s' % step, Workflow.PERM_IDS[perm])
        workflow.save()

        return workflow.to_dict()



TeamsApiV2 = TeamsApiV2Class()

rpc_router = RpcRouter('teams:rpc_router', {
    'TeamsApi': TeamsApi,
    'TeamsApiV2': TeamsApiV2,
})
