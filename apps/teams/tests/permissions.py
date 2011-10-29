
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
     can_assign_taks, can_assign_roles, can_change_video_settings, _perms_for, \
     roles_assignable_to
from apps.teams.permissions_const import *
from django.core.exceptions import SuspiciousOperation



class BaseTestPermission(TestCase):

           
    def setUp(self):
        self.auth = dict(username='admin', password='admin')
        self.team  = Team.objects.all()[0]
        self.video = self.team.videos.all()[0]
        self.user = User.objects.all()[0]
        
        self.owner, c= TeamMember.objects.get_or_create(
            user= User.objects.all()[2], role=TeamMember.ROLE_OWNER, team=self.team)

class TestRules(BaseTestPermission):
    fixtures = ["staging_users.json", "staging_videos.json", "staging_teams.json"]

    def _login(self):
        self.client.login(**self.auth)

    def _test_perms(self, team, user,
                    funcs_true, funcs_false, project=None, lang=None):
        for func in funcs_true:
            self.assertTrue(func(team, user, project, lang), func.__name__)
        
        for func in funcs_false:
            res = func(team, user, project, lang)
            self.assertFalse(res, func.__name__)
            
    def test_roles_assignable(self):
        
        user = User.objects.filter(teams__isnull=True)[0]
        team = self.team
        member = add_role(self.team, user, self.owner,TeamMember.ROLE_OWNER)
        self.assertItemsEqual(roles_assignable_to(team, user, ROLE_OWNER), [
            ROLE_OWNER, ROLE_ADMIN, ROLE_MANAGER, ROLE_CONTRIBUTOR
        ])
        remove_role(team, user, TeamMember.ROLE_OWNER)
        
        member = add_role(self.team, user, self.owner, TeamMember.ROLE_ADMIN)
        self.assertItemsEqual(roles_assignable_to(team, user, ROLE_ADMIN), [
             ROLE_ADMIN, ROLE_MANAGER, ROLE_CONTRIBUTOR
        ])
        remove_role(team, user, TeamMember.ROLE_ADMIN)
        team = refresh_obj(team)
        member = add_role(self.team, user, self.owner, TeamMember.ROLE_MANAGER)
        self.assertItemsEqual(roles_assignable_to(team , user, ROLE_MANAGER), [
             ROLE_MANAGER, ROLE_CONTRIBUTOR
        ])
        remove_role(team, user, TeamMember.ROLE_MANAGER)
        team = refresh_obj(team)
        member = add_role(self.team, user, self.owner,TeamMember.ROLE_CONTRIBUTOR)
        self.assertItemsEqual(roles_assignable_to(team, user, ROLE_CONTRIBUTOR), [
              ROLE_CONTRIBUTOR
        ])
        
    def test_perms_for_manager(self):
        # project
        print 
        self.assertItemsEqual(_perms_for(TeamMember.ROLE_MANAGER, Team), (
            ASSIGN_TASKS_PERM[0],
            ADD_VIDEOS_PERM[0] ,
            EDIT_VIDEO_SETTINGS_PERM[0],
            PERFORM_MANAGER_REVIEW_PERM[0] ,
            PERFORM_PEER_REVIEW_PERM[0],
            ACCEPT_ASSIGNMENT_PERM[0] ,
        ))
    def test_owner_has_it_all(self):
        user = User.objects.filter(teams__isnull=True)[0]
        add_role(self.team, user, self.owner,TeamMember.ROLE_OWNER)

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
        user = User.objects.filter(teams__isnull=True)[0]
        add_role(self.team, user, self.owner,TeamMember.ROLE_ADMIN)

        
        self._test_perms(self.team,
                         user, [
                             can_change_team_settings,
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
                             can_assign_taks,
                             can_change_team_settings,
                             can_message_all_members,
                             can_accept_assignments,
                             can_manager_review,
                             can_peer_review,
                         ], [], project=project)
        team_video = TeamVideo.objects.filter(team=self.team)[0]
        lang = team_video.video.subtitle_language()
          

    def test_manager_for_team(self):
        user = User.objects.filter(teams__isnull=True)[0]
        project = self.team.default_project
        add_role(self.team, user, self.owner,TeamMember.ROLE_MANAGER)
            
        self._test_perms(self.team,
                         user, [
                             can_assign_taks,
                             can_add_video,
                             can_change_video_settings, 
                             can_peer_review,
                             can_manager_review,
                             can_accept_assignments,
                         ],[
                             can_change_team_settings,
                             can_assign_roles,
                             can_message_all_members,
                         ])
        
    def test_manager_for_project(self):
        user = User.objects.filter(teams__isnull=True)[0]
        project = self.team.default_project
        add_role(self.team, user, self.owner, TeamMember.ROLE_MANAGER, project )
            
        self._test_perms(self.team,
                         user, [
                             can_assign_taks,
                             can_add_video,
                             can_change_video_settings,
                             can_peer_review,
                             can_manager_review,
                             can_accept_assignments,
                         ],[
                             can_change_team_settings,
                             can_message_all_members,
                         ], project)
        # project wise, we can't do anything'
        self._test_perms(self.team,
                         user, [
                         ],[
                             can_change_team_settings,
                             can_accept_assignments,
                             can_message_all_members,
                             can_assign_taks,
                             can_add_video,
                             can_change_video_settings,
                             can_peer_review,
                             can_manager_review,
                             ])

    def test_can_assign_roles(self):
        # for role assignment, we need more specific testing
        user = User.objects.filter(teams__isnull=True)[0]
        project = self.team.default_project
        add_role(self.team, user, self.owner,TeamMember.ROLE_ADMIN, project)
        self.assertTrue(can_assign_roles(self.team, user,  project, role=ROLE_CONTRIBUTOR))
        self.assertFalse(can_assign_roles(self.team, user,   project, role=ROLE_OWNER))
    
