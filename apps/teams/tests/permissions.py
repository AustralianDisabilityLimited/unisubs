
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


from guardian.shortcuts import assign, remove_perm, get_objects_for_user

from apps.teams.tests.teamstestsutils import refresh_obj, reset_solr , rpc
from apps.teams.models import Team, TeamMember

from apps.teams.permissions import remove_role, add_role, \
     can_edit_subs_for, can_peer_review, can_manager_review, \
     can_accept_assignments, can_message_all_members,  \
     can_change_team_settings, can_change_video_settings, can_add_video, \
     can_assign_taks, can_assign_roles
from apps.teams.permissions_const import *
from django.core.exceptions import SuspiciousOperation



class BaseTestPermission(TestCase):

           
    def setUp(self):
        self.auth = dict(username='admin', password='admin')
        self.team  = Team.objects.all()[0]
        self.video = self.team.videos.all()[0]
        self.user = User.objects.all()[0]

class TestRules(BaseTestPermission):
    fixtures = ["staging_users.json", "staging_videos.json", "staging_teams.json"]

    def _login(self):
        self.client.login(**self.auth)

    def _test_perms(self, team, user,
                    funcs_true, funcs_false, project=None, lang=None):
        for func in funcs_true:
            print func.__name__
            self.assertTrue(func(team, user, project, lang))
        
        for func in funcs_false:
            self.assertFalse(func(team, user, project, lang))
            
    def test_owner_has_it_all(self):
        user = User.objects.filter(teammember__isnull=True)[0]
        add_role(self.team, user, None, None, TeamMember.ROLE_OWNER)

        self._test_perms(self.team,
                         user, [
                             can_change_team_settings,
                             can_assign_roles,
                             can_assign_taks,
                             can_change_team_settings,
                             can_message_all_members,
                             can_accept_assignments,
                             can_manager_review,
                             can_peer_review,
                         ], [])
        project = self.team.default_project
        self._test_perms(self.team,
                         user, [
                             can_change_team_settings,
                             can_assign_roles,
                             can_assign_taks,
                             can_change_team_settings,
                             can_message_all_members,
                             can_accept_assignments,
                             can_manager_review,
                             can_peer_review,
                         ], [], project=project)
        team_video = TeamVideo.objects.filter(team=self.team)[0]
        lang = team_video.video.subtitle_language()
        self.assertTrue(lang)
        self._test_perms(self.team,
                         user, [
                             can_change_team_settings,
                             can_assign_roles,
                             can_assign_taks,
                             can_change_team_settings,
                             can_message_all_members,
                             can_accept_assignments,
                             can_manager_review,
                             can_peer_review,
                         ], [],lang=lang)
        return
        
    def test_admin_team_wide(self):
        user = User.objects.filter(teammember__isnull=True)[0]
        add_role(self.team, user, None, None, TeamMember.ROLE_ADMIN)

        
        self._test_perms(self.team,
                         user, [
                             can_change_team_settings,
                             can_assign_roles,
                             can_assign_taks,
                             can_change_team_settings,
                             can_accept_assignments,
                             can_manager_review,
                             can_peer_review,
                         ], [])
        project = self.team.default_project
        self._test_perms(self.team,
                         user, [
                             can_change_team_settings,
                             can_assign_roles,
                             can_assign_taks,
                             can_change_team_settings,
                             can_message_all_members,
                             can_accept_assignments,
                             can_manager_review,
                             can_peer_review,
                         ], [], project=project)
        team_video = TeamVideo.objects.filter(team=self.team)[0]
        lang = team_video.video.subtitle_language()
          

    def test_admin_for_project(self):
        user = User.objects.filter(teammember__isnull=True)[0]
        project = self.team.default_project
        add_role(self.team, user, project, None, TeamMember.ROLE_ADMIN)
        print get_objects_for_user(user, ASSIGN_TASKS_PERM, klass=project)
        for p in PROJECT_PERMISSIONS_RAW:
            print "%s %s" % (p[0], user.has_perm(p[0], project))
            
        self._test_perms(self.team,
                         user, [
                             can_peer_review,
                             can_assign_roles,
                             can_manager_review,
                             can_assign_taks,
                             can_accept_assignments,
                             can_message_all_members,
                         ],[
                             can_change_team_settings,
                         ], project)
        self._test_perms(self.team,
                         user, [

                         ], [
                             can_change_team_settings,
                             can_assign_roles,
                             can_assign_taks,
                             can_change_team_settings,
                             can_message_all_members,
                             can_accept_assignments,
                             can_manager_review,
                             can_peer_review,
                         ]  )
        team_video = TeamVideo.objects.filter(team=self.team)[0]  
