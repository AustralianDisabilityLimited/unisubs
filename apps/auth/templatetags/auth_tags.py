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
from django.utils.translation import ugettext_lazy as _

register = template.Library()

@register.inclusion_tag('auth/_email_confirmation_notification.html', takes_context=True)
def email_confirmation_notification(context, force=False):
    user = context['request'].user
    content = ''
    if user.is_authenticated():
        if not user.email:
            content = _(u'Fill email field, please.')
        elif not user.valid_email:
            content = _(u'Confirm your email, please.')
            
    context['notification_content'] = content
    return context