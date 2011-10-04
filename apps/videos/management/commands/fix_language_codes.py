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

from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db.transaction import commit_on_success
from auth.models import CustomUser, UserLanguage
from statistic.models import SubtitleFetchCounters
from subrequests.models import SubtitleRequest
from videos.models import SubtitleLanguage

class Command(BaseCommand):
    def _fix_lang(self, model_class, field, old_value, new_value):
        filter_kwargs = { field: old_value }
        update_kwargs = { field: new_value }
        num_rows = model_class.objects.filter(
            **filter_kwargs).update(**update_kwargs)
        print('{0} {1} records updated!'.format(num_rows, model_class))

    def _fix(self, model_class, field):
        self._fix_lang(model_class, field, 'urd', 'ur')
        self._fix_lang(model_class, field, 'pan', 'pa')

    def handle(self, *args, **kwargs):
        """ This is super-temporary, for fixing 
        https://unisubs.sifterapp.com/projects/12298/issues/445909/comments """

        self._fix(CustomUser, "preferred_language")
        self._fix(UserLanguage, "language")
        self._fix(SubtitleFetchCounters, "language")
        self._fix(SubtitleRequest, "language")
        self._fix(SubtitleLanguage, "language")
