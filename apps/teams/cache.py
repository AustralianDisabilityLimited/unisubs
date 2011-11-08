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

import datetime

from django.core.cache import cache
from django.conf import settings
TIMEOUT = 60 * 60 * 24 * 5 # 5 days

def _team_readable_langs_id(team):
    return u"%s-readable-langs" % team.pk

def _team_writable_langs_id(team):
    return u"%s-readable-langs" % team.pk
    
def invalidate_lang_preferences(team):
    cache.delete(_team_readable_langs_id(team))
    cache.delete(_team_writable_langs_id(team))
    
def get_readable_langs(team):
    cache_key = _team_readable_langs_id(team)
    value = cache.get(cache_key)
    if value is  None:
        from teams.models import TeamLanguagePreference
        value = TeamLanguagePreference.objects._generate_readable(team)
        cache.set(cache_key, value, TIMEOUT)
    return value
    
def get_writable_langs(team):
    cache_key = _team_writable_langs_id(team)
    value = cache.get(cache_key)
    if value is  None:
        from teams.models import TeamLanguagePreference
        value = TeamLanguagePreference.objects._generate_writable(team)
        cache.set(cache_key, value, TIMEOUT)
    return value
