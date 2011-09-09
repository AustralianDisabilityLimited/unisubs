#from django.utils import unittest
from teams.models import Team, TeamMember
from auth.models import CustomUser as User
from videos.models import Video
from apps.icanhaz.models import VideoVisibilityPolicy

from django.test import TestCase


class BusinessLogic(TestCase):
    fixtures = [  "staging_users.json", "staging_videos.json", "staging_teams.json"]

    def setUp(self):
        self.superuser , created = User.objects.get_or_create(username='superuser1', is_superuser=True)

        self.user1 = User.objects.all()[0]
        self.user2 = User.objects.all()[1]
        self.superuser2, x = User.objects.get_or_create(username='superuser2', is_superuser=True)
        self.regular_user = User.objects.filter(is_superuser=False)[0]
        self.team1 = Team(name='test11', slug='test11')
        self.team1.save()
        self.team1_member = TeamMember(team=self.team1, user=self.user1)
        self.team1_member.save()
        self.team2 = Team(name='test22', slug='test22')
        self.team2.save()
        self.team2_member = TeamMember(team=self.team2, user=self.user2)
        self.team2_member.save()
        self.video = Video.objects.all()[0]

    def test_has_owner(self):
        self.assertFalse(VideoVisibilityPolicy.objects.video_has_owner(self.video))
        policy = VideoVisibilityPolicy.objects.create_for_video(
            self.video,
            VideoVisibilityPolicy.SITE_VISIBILITY_PUBLIC,
            self.superuser,
            
            )
        self.assertTrue(VideoVisibilityPolicy.objects.video_has_owner(self.video))
        
    def test_belongs_to_team(self):
        policy = VideoVisibilityPolicy.objects.create_for_video(
            self.video,
            VideoVisibilityPolicy.SITE_VISIBILITY_PUBLIC,
            self.superuser
        )

        #policy = VideoVisibilityPolicy.objects.create_for_video(self.video, self.superuser, )
        self.assertFalse(policy.belongs_to_team)
        policy.delete()

        policy = VideoVisibilityPolicy.objects.create_for_video(
            self.video,
            VideoVisibilityPolicy.SITE_VISIBILITY_PUBLIC,
            self.team1)
        self.assertTrue(policy.belongs_to_team)

    def test_create_one_only_per_video(self):
        policy = VideoVisibilityPolicy.objects.create_for_video(
            self.video,
            VideoVisibilityPolicy.SITE_VISIBILITY_PUBLIC,
            owner = self.superuser
        )
        with self.assertRaises(Exception):
            policy = VideoVisibilityPolicy.objects.create_for_video(
                video,
                VideoVisibilityPolicy.SITE_VISIBILITY_PUBLIC,
                self.team1,
            )
        with self.assertRaises(Exception):
            policy = VideoVisibilityPolicy.objects.create_for_video(
                self.video,
                VideoVisibilityPolicy.SITE_VISIBILITY_PUBLIC,
                self.superuser,
                )

    def test_user_can_see_user(self):

        video = Video.objects.all()[0]
        # video with no policy should be visible to all
        self.assertTrue(VideoVisibilityPolicy.objects.user_can_see( self.regular_user, self.video))
        policy = VideoVisibilityPolicy.objects.create_for_video(
            self.video,
            VideoVisibilityPolicy.SITE_VISIBILITY_PUBLIC,
            self.superuser,
        )
        # super users should always be able to see them
        self.assertTrue(VideoVisibilityPolicy.objects.user_can_see(self.superuser2, self.video ))
        # regular users not 
        self.assertFalse(VideoVisibilityPolicy.objects.user_can_see(self.regular_user, self.video))
        policy.delete()
        policy = VideoVisibilityPolicy.objects.create_for_video(
            self.video,
            VideoVisibilityPolicy.SITE_VISIBILITY_PUBLIC,
            self.team1,
        )
        self.assertFalse(VideoVisibilityPolicy.objects.user_can_see( self.team2_member.user, self.video))
        self.assertTrue(VideoVisibilityPolicy.objects.user_can_see( self.team1_member.user, self.video))

    def test_id_for_video(self):
        pass
       
class ViewTest(TestCase):

    
    def test_public_video_still_public(self):
        pass
        
    def test_public_video_secret_redirects(self):
        pass

    def test_private_video_available_thourh_secret(self):
        pass

    def test_private_video_owner_only_available_throughh_secret(self):
        pass

    def test_private_video_owner_only_hidden_to_world(self):
        pass            
                
class WidgetTest(TestCase):

    def test_public_widget(self):
        pass

    def test_private_widget_not_on_video_url(self):
        pass

    def test_private_widget_on_video_id(self):
        pass

    def test_on_private_on_referral(self):
        pass
