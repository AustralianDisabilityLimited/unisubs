import json
import datetime
import time

from django.utils.translation import ugettext_lazy as _
from django.shortcuts import get_object_or_404, render_to_response
from django.contrib.auth.decorators import login_required
from django.core.exceptions import SuspiciousOperation
from django.core.urlresolvers import reverse
from django.forms.models import model_to_dict
from django.http import HttpResponseForbidden, HttpResponseRedirect, HttpResponse, Http404
from django.template import RequestContext
from django.template.loader import render_to_string
from django.contrib.sites.models import Site

from apps.videos.models import Video

from icanhaz.models import VideoVisibilityPolicy
from icanhaz.forms import VideoVisibilityForm


@login_required
def get_visibility_form(request, video_id):
    video = get_object_or_404(Video, video_id=video_id)
    if not VideoVisibilityPolicy.objects.can_create_for_video(video, request.user):
        return HttpResponseForbidden(_("You cannot change visibility for this video."))
    message = ""
    success = False
    site_secret_key = None
    secret_url = None
    if request.method == "POST":
        form = VideoVisibilityForm(
            request.user,
            video,
            data=request.POST)
        if form.is_valid():
            policy = VideoVisibilityPolicy.objects.update_policy(
                    video,
                    form.cleaned_data["site_visibility_policy"],
                    form.cleaned_data["widget_visibility_policy"],
                    form.cleaned_data["owner"],)
            
            message = _("Settings saved!")
            if policy.site_visibility_policy == VideoVisibilityPolicy.SITE_VISIBILITY_PRIVATE_WITH_KEY:
                secret_url = "http://%s%s" % (Site.objects.get_current().domain , reverse("videos:history", kwargs={"video_id":policy.site_secret_key}))
            
            success = True
            if policy.site_visibility_policy is not VideoVisibilityPolicy.SITE_VISIBILITY_PUBLIC:
                site_secret_key = policy.site_secret_key
        else:
            message = _("Please correct the errors bellow!")
    else:
        if video.policy:
            form = VideoVisibilityForm(request.user, video, data=model_to_dict(video.policy))
        else:    

            form = VideoVisibilityForm(request.user, video)

        
            
    return render_to_response("icanhaz/video_visibility_form.html", {
            "video":video,
            'secret_url':secret_url,
            "form":form,
            "message":message,
            "site_secret_key": site_secret_key,
            "success":success}, RequestContext(request))    
