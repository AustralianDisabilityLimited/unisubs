import json
import datetime
import time

from django.utils.translation import ugettext_lazy as _
from django.shortcuts import get_object_or_404, render_to_response
from django.contrib.auth.decorators import login_required
from django.core.exceptions import SuspiciousOperation
from django.forms.models import model_to_dict
from django.http import HttpResponseForbidden, HttpResponseRedirect, HttpResponse, Http404
from django.template import RequestContext
from django.template.loader import render_to_string

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
    if request.method == "POST":
        form = VideoVisibilityForm(
            user=request.user,
            video=video,
            data=request.POST)
        if form.is_valid():
            policy = VideoVisibilityPolicy.objects.update_policy(
                    video,
                    form.cleaned_data["site_visibility_policy"],
                    form.cleaned_data["widget_visibility_policy"],
                    form.cleaned_data["owner"],)
            message = _("Settings saved!")
            success = True
            if policy.site_visibility_policy is not VideoVisibilityPolicy.SITE_VISIBILITY_PUBLIC:
                site_secret_key = policy.site_secret_key
        else:
            message = _("Please correct the errors bellow!")
    else:
        if video.policy:
            data = model_to_dict(video.policy)
        form = VideoVisibilityForm(
            data=data,
            user=request.user,
            video=video)
    return render_to_response("icanhaz/video_visibility_form.html", {
            "video":video,
            "form":form,
            "message":message,
            "site_secret_key": site_secret_key,
            "success":success}, RequestContext(request))    
