import datetime, time, random

from django.db import models
from django.contrib.contenttypes import generic
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import ugettext_lazy as _
from django.utils.hashcompat import sha_constructor
from django.conf import settings

from teams.models import Team
from videos.models import Video
from auth.models import CustomUser as User
from widget.video_cache import invalidate_video_id

def _debug(func):
    def wrapper(*args, **kwargs):
        res = func(*args, **kwargs)
        print "called %s with : %s, %s => %s" %  (func.__name__, args, kwargs, res)
        return res
    return wrapper


class VideoVisibilityManager(models.Manager):


    def video_for_user(self, user, video_identifier):

        """
        Return a video if the passed user has the right to view it.

        Arguments:
        - `self`: .
        - `user`: .
        - `video_identifier`: The video_id, video.policy.secret_key for that video, or the video instance itself (mainly to avoid an extraneous lookup)
        """
        secret_key = None
        if not isinstance(video_identifier, Video):
            try:

                policy = VideoVisibilityPolicy.objects.get(site_secret_key=video_identifier)
                secret_key = video_identifier
                video = policy.video
            except VideoVisibilityPolicy.DoesNotExist:
                try:
                    video= Video.objects.get(video_id=video_identifier)
                except Video.DoesNotExist:
                    return None
        if self.user_can_see(user, video, secret_key):
            return video
        return None

    def user_can_see(self, user, video, secret_key=None):
        """
        Determines if a user can see the given video.
        If no policy exists for this video, it's
        though to be public, thus avoiding to create
        rows for most videos.
        """
        q = self.filter(video=video)
        policy = q.exists() and q[0]

        if not policy or policy.is_public:
            return True
        else:
            # if we allow secret urls and they match
            if policy.site_visibility_policy == VideoVisibilityPolicy.SITE_VISIBILITY_PRIVATE_WITH_KEY and \
                    policy.site_secret_key == secret_key:
                return True
            if policy.owner == user or (hasattr(user, "is_superuser") and user.is_superuser):
                return True
            if policy.belongs_to_team:
                return policy.owner.can_see_video(user, video)
            
    def can_create_for_video(self, video, user):
        if not video.policy:
            return True
        
        elif video.policy.owner == user or hasattr(user, "is_superuser") and user.is_superuser:

            return True
        elif video.policy.belongs_to_team and hasattr(user, "is_authenticated"):
            return video.policy.owner.can_see_video(user, video)

        
    def create_for_video(self, video, site_policy, owner, widget_policy=None):
        if widget_policy is None:
            widget_policy = VideoVisibilityPolicy.WIDGET_DEFAULT_POLICY
        ct = ContentType.objects.get_for_model(owner)
        if owner.__class__ not in (User, Team):
            raise Exception("Wrong content type, must be Team or custom user got %s"
                            % owner.__class__)
        v = VideoVisibilityPolicy(
            video=video,
            owner=owner,
            site_visibility_policy=site_policy,
            widget_visibility_policy=widget_policy)
        v.save()
        return v
    

    def update_policy(self, video, site_policy, widget_policy, owner):
        if not can_create_for_video(self, video, policy, owner):
            raise SuspiciousOperation("no create@")
        full_policy = video.policy
        if not full_policy:
            # we are creating one,
            full_policy = self.create_for_video(video, site_policy, owner, widget_visibility_policy)
        else:
            full_policy.site_visibility_policy = site_policy.site_policy
            full_policy.widget_visibility_policy = widget_policy
            full_policy.save()
        
    # we change owners
    def video_has_owner(self, video):
        return self.filter(video=video).exists()

    def gen_secret(self, policy):
        inp_str = "%s-%s-%s" % (settings.SECRET_KEY, time.time()  / (random.randint(0,1000)* 1.0), policy.video.pk)
        return sha_constructor(inp_str).hexdigest()[:40]

    def id_for_video(self, video):
        if video.policy and not video.policy.is_public:
            return video.policy.site_secret_key
        return video.video_id

    def site_policy_for_video(self, video):
        return (video.policy and video.policy.site_visibility_policy) or VideoVisibilityPolicy.objects.SITE_DEFAULT_POLICY

    def widget_policy_for_video(self, video):
        return (video.policy and video.policy.widget_visibility_policy) or VideoVisibilityPolicy.objects.WIDGET_DEFAULT_POLICY

class VideoVisibilityPolicy(models.Model):
    video = models.OneToOneField(Video, unique=True, related_name="_policy")
    created = models.DateTimeField(blank=True)
    modified = models.DateTimeField(blank=True)

    content_type = models.ForeignKey(ContentType, blank=True, null=True,
            related_name="content_type_set_for_visibility_policy")
    object_id = models.IntegerField( blank=True)
    # an owner can be either a user or a team
    owner = generic.GenericForeignKey(ct_field="content_type", fk_field="object_id")
    
    SITE_VISIBILITY_PUBLIC = "public"
    SITE_VISIBILITY_PRIVATE_WITH_KEY = "private-with-key"
    SITE_VISIBILITY_PRIVATE_OWNER = "private-owner-only"
    SITE_VISIBILITY_POLICIES = (
        (SITE_VISIBILITY_PUBLIC, _("Public")),
        (SITE_VISIBILITY_PRIVATE_WITH_KEY, _("Only with secret url")),
        (SITE_VISIBILITY_PRIVATE_OWNER, _("Only authorized members")),
    )
    SITE_DEFAULT_POLICY = SITE_VISIBILITY_PUBLIC
    site_visibility_policy = models.CharField(choices=SITE_VISIBILITY_POLICIES,
                                         default=SITE_DEFAULT_POLICY,
                                         max_length=32)
    # the secret kwy for url
    site_secret_key  = models.CharField(max_length=40,  unique=True)
    
    WIDGET_VISIBILITY_PUBLIC = "public"
    WIDGET_VISIBILITY_HIDDEN_WITH_KEY = "private-with-key"
    WIDGET_VISIBILITY_HIDDEN = "hidden"
    WIDGET_VISIBILITY_WHITELISTED = "whitelisted"
    WIDGET_DEFAULT_POLICY = WIDGET_VISIBILITY_PUBLIC
    WIDGET_VISIBILITY_POLICIES = (
        (WIDGET_VISIBILITY_PUBLIC, _("public")),
        (WIDGET_VISIBILITY_HIDDEN_WITH_KEY, _("spoofable, but does not take to the site page for the video")),
        (WIDGET_VISIBILITY_HIDDEN, _("no embeding allowed")),
        (WIDGET_VISIBILITY_WHITELISTED , "to specified domains only"),
    )
    widget_visibility_policy = models.CharField(choices=WIDGET_VISIBILITY_POLICIES,
                                         default=WIDGET_VISIBILITY_PUBLIC,
                                         max_length=32)

    objects = VideoVisibilityManager()

    def save(self, skips_timestamp=False, *args, **kwargs):
        """
        Saves this policy, updating time stamps and blowing up
        the cache for the video.
        """
        if self.created is None:
            self.created  = datetime.datetime.now()
        if not self.site_secret_key:
            self.site_secret_key = VideoVisibilityPolicy.objects.gen_secret(self)
            print self.site_secret_key
        if skips_timestamp is False:
            self.modified = datetime.datetime.now()
        super(VideoVisibilityPolicy, self).save(*args, **kwargs)
        invalidate_video_id(self.video.video_id)    

    def delete(self, *args, **kwargs):
        invalidate_video_id(self.video.video_id)
        super(VideoVisibilityPolicy, self).delete(*args, **kwargs)
        

    @property    
    def is_public(self):
        return self.site_visibility_policy == VideoVisibilityPolicy.SITE_VISIBILITY_PUBLIC

    @property
    def belongs_to_team(self):
        return self.content_type == ContentType.objects.get_for_model(Team)
    
    def __unicode__(self):
        return "Policy for %s - %s " % (self.video, self.site_visibility_policy, )
    
