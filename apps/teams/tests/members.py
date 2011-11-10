
import os
import json

from django.test import TestCase
from django.core.urlresolvers import reverse
from os import path

from django.conf import settings
from apps.teams.models import Team, Invite, TeamVideo, \
    Application, TeamMember, TeamVideoLanguage
from messages.models import Message
from videos.models import Video, VIDEO_TYPE_YOUTUBE, SubtitleLanguage, Action
from django.db.models import ObjectDoesNotExist
from auth.models import CustomUser as User
from django.contrib.contenttypes.models import ContentType
from apps.teams import tasks
from widget.rpc import Rpc
from datetime import datetime, timedelta
from django.core.management import call_command
from django.core import mail
from apps.videos import metadata_manager 
import re



from apps.teams.tests.teamstestsutils import refresh_obj, reset_solr , rpc
from apps.teams.models import Team, TeamMember

from apps.teams.permissions import remove_role, add_role, \
     can_edit_subs_for, can_peer_review, can_manager_review, \
     can_accept_assignments, can_message_all_members,  \
     can_change_team_settings, can_change_video_settings, can_add_video, \
     can_assign_tasks, can_assign_roles, can_change_video_settings, _perms_for, \
     roles_assignable_to
from django.core.exceptions import SuspiciousOperation
from apps.teams.forms import CreateTeamForm


class BaseMembershipTests(TestCase):

           
    def setUp(self):
        self.auth = dict(username='admin', password='admin')
        self.team  = Team.objects.all()[0]
        self.team.video_policy = Team.MEMBER_ADD
        self.video = self.team.videos.all()[0]
        self.user = User.objects.all()[0]
        
        self.owner, c= TeamMember.objects.get_or_create(
            user= User.objects.all()[2], role=TeamMember.ROLE_OWNER, team=self.team)

class MembershipTests(BaseMembershipTests):
    fixtures = ["staging_users.json", "staging_videos.json", "staging_teams.json"]

    def _login(self):
        self.client.login(**self.auth)
        
    def test_new_team_has_owner(self):
        f = CreateTeamForm(
            self.user,
            dict(
            name="arthur",
            slug="arthur",
            membership_policy=1,
            video_policy=1,    
        ))
        t = f.save(self.user)
        self.assertEqual(
            t.members.get(user=self.user).role,
            TeamMember.ROLE_OWNER,
            "New teams should always be created by their owner")
