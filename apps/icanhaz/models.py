import datetime, time

from django.db import models
from django.contrib.contenttypes import generic
from django.contrib.contenttypes.models import ContentType
from django.utils.translation import ugettext_lazy as _
from django.utils.hashcompat import sha_constructor
from django.conf import settings

from teams.models import Team
from videos.models import Video
from auth.models import CustomUser as User


class VideoVisibilityManager(models.Manager):

    def video_for_user(self, user, secret_key):
        try:
            policy = VideoVisibilityPolicy.objects.get(site_secret_key=secret_key)
            if self.user_can_see(user, policy.video):
                return policy.video
        except VideoVisibilityPolicy.DoesNotExist:
            try:
                return Video.objects.get(video_id=secret_key)
            except Video.DoesNotExist:
                return None
        
        return None
    
    def user_can_see(self, user, video):
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
            if policy.owner == user or user.is_superuser:
                return True
            elif policy.belongs_to_team:
                return policy.owner.can_see_video(user, video)
            
        
    def create_for_video(self, video, policy, owner):
        ct = ContentType.objects.get_for_model(owner)
        if owner.__class__ not in (User, Team):
            raise Exception("Wrong content type, must be Team or custom user got %s"
                            % owner.__class__)
        
        v = VideoVisibilityPolicy(
            video=video,
            owner=owner,
            site_visibility_policy=policy)
        v.save()
        return v
        

    def video_has_owner(self, video):
        return self.filter(video=video).exists()

    def gen_secret(self, policy):
        inp_str = "%s-%s-%s" % (settings.SECRET_KEY, time.time(), policy.video.pk)
        return sha_constructor(inp_str).hexdigest()[:40]

    def id_for_video(self, video):
        if video.policy and not video.policy.is_public:
            return video.policy.secret_key
        return video.video_id

class VideoVisibilityPolicy(models.Model):
    video = models.OneToOneField(Video, unique=True, related_name="_policy")
    created = models.DateTimeField(blank=True)
    modified = models.DateTimeField(blank=True)

    content_type = models.ForeignKey(ContentType, blank=True, null=True,
            related_name="content_type_set_for_visibility_policy")
    object_id = models.IntegerField( blank=True)
    # an owner can be either a user or a team
    owner = generic.GenericForeignKey(ct_field="content_type", fk_field="object_id")
    
    SITE_VISIBILITY_PUBLIC = "public",
    SITE_VISIBILITY_PRIVATE_WITH_KEY = "PRIVATE-with-key",
    SITE_VISIBILITY_PRIVATE_OWNER = "private-owner-only"
    SITE_VISIBILITY_POLICIES = (
        (SITE_VISIBILITY_PUBLIC, _("public")),
        (SITE_VISIBILITY_PRIVATE_WITH_KEY, _("only with secret url")),
        (SITE_VISIBILITY_PRIVATE_OWNER, _("only authorized members")),
    )
    site_visibility_policy = models.CharField(choices=SITE_VISIBILITY_POLICIES,
                                         default=SITE_VISIBILITY_PUBLIC,
                                         max_length=32)
    # the secret kwy for url
    site_secret_key  = models.CharField(max_length=40,  unique=True)
    
    WIDGET_VISIBILITY_PUBLIC = "public",
    WIDGET_VISIBILITY_HIDDEN_WITH_KEY = "private-with-key",
    WIDGET_VISIBILITY_HIDDEN = "hidden"
    WIDGET_VISIBILITY_WHITELISTED = "whitelisted"
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
        if self.created is None:
            self.created  = datetime.datetime.now()
        if not self._site_secret_key:
            _site_secret_key = VideoVisibilityPolicy.objects.gen_secret(self)
        if skips_timestamp is False:
            self.modified = datetime.datetime.now()
        super(VideoVisibilityPolicy, self).save(*args, **kwargs)

    @property    
    def is_public(self):
        return self.site_visibility_policy == VideoVisibilityPolicy.SITE_VISIBILITY_PUBLIC

    @property
    def belongs_to_team(self):
        return self.content_type == ContentType.objects.get_for_model(Team)
    
    def __unicode__(self):
        return "Policy for %s - %s" % (self.video, self.site_visibility_policy)
    
