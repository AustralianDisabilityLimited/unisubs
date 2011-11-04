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
from os import path
from django.core.urlresolvers import reverse
from auth.models import CustomUser as User
from django.conf import settings
from django.test import TestCase

from apps.teams.models import Team, TeamMember
from apps.videos.models import Video, VIDEO_TYPE_YOUTUBE

class ViewsTests(TestCase):

    fixtures = ["staging_users.json", "staging_videos.json", "staging_teams.json"]
    
    def setUp(self):
        self.auth = {
            "username": u"admin",
            "password": u"admin"}
            
    def _create_base_team(self):
       self.team = Team(
           slug="new-team",
            membership_policy=4,
            video_policy =1,
           name="New-name") 
       self.team.save()
       user, created = User.objects.get_or_create(
           username=self.auth["username"])
       tm = TeamMember.objects.create_first_member(self.team, user) 
       return self.team
       
       
    def test_team_create(self):
        
        
        self.client.login(**self.auth)
        
        #------- create ----------
        response = self.client.get(reverse("teams:create"))
        self.failUnlessEqual(response.status_code, 200)
        
        data = {
            "description": u"",
            "video_url": u"",
            "membership_policy": u"4",
            "video_policy": u"1",
            "logo": u"",
            "slug": u"new-team",
            "name": u"New team"
        }
        response = self.client.post(reverse("teams:create"), data)
        self.failUnlessEqual(response.status_code, 302)
        self.assertEqual(Team.objects.get(slug=data['slug']).slug, data["slug"])

    def test_team_edit(self ):
        team = self._create_base_team()
        self.client.login(**self.auth)
        url = reverse("teams:settings", kwargs={"slug": team.slug})
        response = self.client.get(url)

        self.failUnlessEqual(response.status_code, 200)
        
        data = {
            "logo": open(path.join(settings.MEDIA_ROOT, "test/71600102.jpg"), "rb")
        }
        url = reverse("teams:edit_logo", kwargs={"slug": team.slug})
        response = self.client.post(url, data)
        self.failUnlessEqual(response.status_code, 200)
        team = Team.objects.get(pk=team.pk)
        self.assertTrue(team.logo)
        
        data = {
            "name": u"New team",
            "video_url": u"http://www.youtube.com/watch?v=tGsHDUdw8As",
            "membership_policy": u"4",
            "video_policy": u"1",
            "description": u"",
            "logo": open(path.join(settings.MEDIA_ROOT, "test/71600102.jpg"), "rb")
        }
        url = reverse("teams:settings", kwargs={"slug": team.slug})
        response = self.client.post(url, data)
        self.failUnlessEqual(response.status_code, 302)
        video = Video.objects.get(videourl__type=VIDEO_TYPE_YOUTUBE, videourl__videoid='tGsHDUdw8As')
        team = Team.objects.get(pk=team.pk)
        self.assertEqual(team.video, video)
