#from django.utils import unittest
from django.test import TestCase
from django.core.urlresolvers import reverse

from teams.models import Team, TeamMember
from auth.models import CustomUser as User
from videos.models import Video
from apps.icanhaz.models import VideoVisibilityPolicy



class BasicDataTest(TestCase):
    fixtures = [  "staging_users.json", "staging_videos.json", "staging_teams.json"]

    def setUp(self):
        self.superuser , created = User.objects.get_or_create(username='superuser1', is_superuser=True)

        self.user1 = User.objects.all()[0]
        self.user2 = User.objects.all()[1]
        self.superuser2, x = User.objects.get_or_create(username='superuser2', is_superuser=True)
        self.regular_user = User.objects.filter(is_superuser=False)[0]
        for user in User.objects.all():
            user.set_password(user.username)
            user.save()
        self.team1 = Team(name='test11', slug='test11')
        self.team1.save()
        self.team1_member = TeamMember(team=self.team1, user=self.user1)
        self.team1_member.save()
        self.team2 = Team(name='test22', slug='test22')
        self.team2.save()
        self.team2_member = TeamMember(team=self.team2, user=self.user2)
        self.team2_member.save()
        self.video = Video.objects.all()[0]

class BusinessLogic(BasicDataTest):
    
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
            VideoVisibilityPolicy.SITE_VISIBILITY_PRIVATE_OWNER,
            self.superuser,
        )
        # super users should always be able to see them
        self.assertTrue(VideoVisibilityPolicy.objects.user_can_see(self.superuser2, self.video ))
        # regular users not 
        self.assertFalse(VideoVisibilityPolicy.objects.user_can_see(self.regular_user, self.video))
        policy.delete()
        policy = VideoVisibilityPolicy.objects.create_for_video(
            self.video,
            VideoVisibilityPolicy.SITE_VISIBILITY_PRIVATE_OWNER,
            self.team1,
        )
        self.assertFalse(VideoVisibilityPolicy.objects.user_can_see( self.team2_member.user, self.video))
        self.assertTrue(VideoVisibilityPolicy.objects.user_can_see( self.team1_member.user, self.video))


    def test_secret_key_for_video(self):
        self.assertTrue(VideoVisibilityPolicy.objects.user_can_see( self.regular_user, self.video))
        policy = VideoVisibilityPolicy.objects.create_for_video(
            self.video,
            VideoVisibilityPolicy.SITE_VISIBILITY_PRIVATE_WITH_KEY,
            self.superuser,
        )
        # super users should always be able to see them
        self.assertTrue(VideoVisibilityPolicy.objects.user_can_see(self.superuser2, self.video ))
        # regular users not 
        self.assertFalse(VideoVisibilityPolicy.objects.user_can_see(self.regular_user, self.video))
        self.assertFalse(VideoVisibilityPolicy.objects.user_can_see(self.regular_user, self.video), "bad=lkey")
        self.assertTrue(VideoVisibilityPolicy.objects.user_can_see(self.regular_user, self.video, policy.site_secret_key))
        

       
class ViewTest(BasicDataTest):


    def test_private_video_closes_public_url(self):
        video_url = reverse("videos:history",
                            kwargs={'video_id':self.video.video_id})
        response = self.client.get(video_url)
        self.assertEqual(response.status_code, 200)
        # moderate the video th
        policy = VideoVisibilityPolicy.objects.create_for_video(
            self.video,
            VideoVisibilityPolicy.SITE_VISIBILITY_PRIVATE_WITH_KEY,
            self.superuser,
        )
        response = self.client.get(video_url)
        self.assertEqual(response.status_code, 403)

    def test_private_video_with_secret_url_for_owner(self):
        video_url = reverse("videos:history",
                            kwargs={'video_id':self.video.video_id})
        response = self.client.get(video_url)
        self.assertEqual(response.status_code, 200)
        # moderate the video th
        policy = VideoVisibilityPolicy.objects.create_for_video(
            self.video,
            VideoVisibilityPolicy.SITE_VISIBILITY_PRIVATE_WITH_KEY,
            self.regular_user,
        )
        response = self.client.get(video_url)
        self.assertEqual(response.status_code, 403)
        self.client.login(username=self.regular_user.username, password=self.regular_user.username )
        # login in as owner should give us access
        response = self.client.get(video_url)
        self.assertEqual(response.status_code, 200)

        video_url_secret = reverse("videos:history",
                            kwargs={'video_id':self.video.policy.site_secret_key})

        # owner should also see the secret url
        response = self.client.get(video_url_secret)
        self.assertEqual(response.status_code, 200)

        # other users should see the secret url as well
        self.client.logout()
        response = self.client.get(video_url_secret)
        self.assertEqual(response.status_code, 200)
        
        

    def test_private_video_with_secret_url_for_teams(self):
        video_url = reverse("videos:history",
                            kwargs={'video_id':self.video.video_id})
        response = self.client.get(video_url)
        self.assertEqual(response.status_code, 200)
        # moderate the video for team
        policy = VideoVisibilityPolicy.objects.create_for_video(
            self.video,
            VideoVisibilityPolicy.SITE_VISIBILITY_PRIVATE_WITH_KEY,
            self.team1,
        )
        response = self.client.get(video_url)
        self.assertEqual(response.status_code, 403)
        self.client.login(username=self.team1_member.user.username, password=self.team1_member.user.username )
        # 
        response = self.client.get(video_url)
        self.assertEqual(response.status_code, 200)

        video_url_secret = reverse("videos:history",
                            kwargs={'video_id':self.video.policy.site_secret_key})

        # owner should also see the secret url
        response = self.client.get(video_url_secret)
        self.assertEqual(response.status_code, 200)

        # other users should see the secret url as well
        self.client.logout()
        response = self.client.get(video_url_secret)
        self.assertEqual(response.status_code, 200)

    def test_private_video_without_secret_url_for_teams(self):
        video_url = reverse("videos:history",
                            kwargs={'video_id':self.video.video_id})
        response = self.client.get(video_url)
        self.assertEqual(response.status_code, 200)
        # moderate the video for team
        policy = VideoVisibilityPolicy.objects.create_for_video(
            self.video,
            VideoVisibilityPolicy.SITE_VISIBILITY_PRIVATE_OWNER,
            self.team1,
        )
        response = self.client.get(video_url)
        self.assertEqual(response.status_code, 403)
        self.client.login(username=self.team1_member.user.username, password=self.team1_member.user.username )
        # 
        response = self.client.get(video_url)
        self.assertEqual(response.status_code, 200)

        video_url_secret = reverse("videos:history",
                            kwargs={'video_id':self.video.policy.site_secret_key})

        # owner should also see the secret url
        response = self.client.get(video_url_secret)
        self.assertEqual(response.status_code, 200)

        # other users should not see the secret url
        self.client.logout()
        response = self.client.get(video_url_secret)
        self.assertEqual(response.status_code, 403)        
        
        
                
class WidgetTest(TestCase):

    def test_public_widget(self):
        pass

    def test_private_widget_not_on_video_url(self):
        pass

    def test_private_widget_on_video_id(self):
        pass

    def test_on_private_on_referral(self):
        pass
