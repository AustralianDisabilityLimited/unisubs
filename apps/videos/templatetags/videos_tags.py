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
from django import template

register = template.Library()

from videos.types import video_type_registrar, VideoTypeError

@register.inclusion_tag('videos/_video.html', takes_context=True)
def render_video(context, video, display_views='total'):
    context['video'] = video
    
    if display_views and hasattr(video, '%s_views' % display_views):
        context['video_views'] = getattr(video, '%s_views' % display_views)
    else:
        context['video_views'] = video.total_views
    
    return context

@register.inclusion_tag('videos/_feature_video.html', takes_context=True)
def feature_video(context, video):
    context['video'] = video
    return context

@register.filter
def is_follower(obj, user):
    #obj is Video or SubtitleLanguage
    if not user.is_authenticated():
        return False
    
    if not obj:
        return False
    
    return obj.followers.filter(pk=user.pk).exists()

@register.simple_tag
def write_video_type_js(video):
    if not video or not bool(video.get_video_url()):
        return 
    try:
        vt = video_type_registrar.video_type_for_url(video.get_video_url())
        if hasattr(vt, "js_url"):
            return '<script type="text/javascript" src="%s"><script/>' % vt.js_url
    except VideoTypeError:    
        return  

@register.simple_tag
def title_for_video(video, language=None):
    if not language:
        return "%s | Universal Subtitles" % video.title_display()
    elif  language.is_original:
        return "%s  with subtitles | Universal Subtitles " % language.get_title_display()
    else:
        return "%s  with %s subtitles | Universal Subtitles " % (language.get_title_display() , language.get_language_display())
        
from django.template.defaulttags import URLNode
class VideoURLNode(URLNode):
    def render(self, video, request):
        if self.asvar:  
            context[self.asvar]= urlparse.urljoin(domain, context[self.asvar])  
            return ''  
        else:  
            return urlparse.urljoin(domain, path)
        path = super(AbsoluteURLNode, self).render(context)
        
        return urlparse.urljoin(domain, path)

def video_url(parser, token, node_cls=VideoURLNode):
    """
    Does the logic to decide if a video must have a secret url passed into it or not.
    If video must be acceceed thourgh private url, the 40chars hash are inserted instead
    of the video_id.
    """
    bits = token.split_contents()
    print "token", token
    print "bits", bits
    node_instance = url(parser, token)
    return node_cls(view_name=node_instance.view_name,
        args=node_instance.args,
        kwargs=node_instance.kwargs,
        asvar=node_instance.asvar)
video_url = register.tag(video_url)


@register.inclusion_tag("videos/_visibility_control_button.html")
def render_visibility_button(video, user):
    # FIXME put the actual criteria for users who can control visibility
    print user, "fdlsjfah"
    if user.is_superuser is False:
        return {}
    return {
        "user"  : user,
        "video": video,
        
     }


    
