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

from django.template import RequestContext
from django.shortcuts import render_to_response
from videos import models
from django.conf import settings
import widget

def youtubedemo(request):
    v, created = models.Video.get_or_create_for_url(
        'http://www.youtube.com/v/1lxm-e0hMTw')
    subs = v.subtitles()
    scripts = [widget.full_path(s) for s in settings.JS_WIDGETIZER[:-1]]
    return render_to_response(
        'streamer/youtubedemo.html',
        { 'js_use_compiled': settings.COMPRESS_MEDIA,
          'videoid': v.video_id,
          'subs': subs,
          'scripts': scripts },
        context_instance=RequestContext(request))

def overlayytdemo(request):
    return _overlaydemo(request, 'streamer/overlayytdemo.html')

def overlayooyalademo(request):
    return _overlaydemo(request, 'streamer/overlayooyalademo.html')

def overlaywistiademo(request):
    return _overlaydemo(request, 'streamer/overlaywistiademo.html')

def overlaybrightcovedemo(request):
    return _overlaydemo(request, 'streamer/overlaybrightcovedemo.html')

def overlayscdemo(request):
    return _overlaydemo(request, 'streamer/overlayscdemo.html')

def _overlaydemo(request, template):
    scripts = [widget.full_path(s) for s in settings.JS_WIDGETIZER[:-1]]
    return render_to_response(
        template,
        { 'js_use_compiled': settings.COMPRESS_MEDIA,
          'scripts': scripts },
        context_instance=RequestContext(request))
