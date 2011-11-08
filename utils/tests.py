# -*- coding: utf-8 -*-
# Universal Subtitles, universalsubtitles.org
#
# Copyright (C) 2011 Participatory Culture Foundation
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program. If not, see
# http://www.gnu.org/licenses/agpl-3.0.html.

from django.test import TestCase
from videos.models import Video
from utils.multi_query_set import MultiQuerySet
from language_codes import LanguageCode


class MultiQuerySetTest(TestCase):
    fixtures = ['test.json']

    def test_full(self):
        self.assertEqual(list(Video.objects.all()),
                         list(MultiQuerySet(Video.objects.all())),
                         "Full, single MQS didn't match full QS.")

        self.assertEqual(list(Video.objects.all()),
                         list(MultiQuerySet(Video.objects.none(),
                                            Video.objects.all(),
                                            Video.objects.none())),
                         "Full MQS with blanks didn't match full QS.")

        self.assertEqual(list(Video.objects.all()) + list(Video.objects.all()),
                         list(MultiQuerySet(Video.objects.none(),
                                            Video.objects.all(),
                                            Video.objects.none(),
                                            Video.objects.all())),
                         "Double MQS with blanks didn't match double full QS.")

    def test_slice(self):
        qs = Video.objects.all()
        mqs = MultiQuerySet(Video.objects.all())

        self.assertEqual(list(qs[0:1]),
                         list(mqs[0:1]),
                         "MQS[:1] failed.")

        self.assertEqual(list(qs[0:2]),
                         list(mqs[0:2]),
                         "MQS[:2] failed.")

        self.assertEqual(list(qs[0:3]),
                         list(mqs[0:3]),
                         "MQS[:3] (out-of-bounds endpoint) failed.")

        self.assertEqual(list(qs[1:3]),
                         list(mqs[1:3]),
                         "MQS[1:3] failed.")

        self.assertEqual(list(qs[2:3]),
                         list(mqs[2:3]),
                         "MQS[2:3] failed.")

        self.assertEqual(list(qs[1:1]),
                         list(mqs[1:1]),
                         "MQS[1:1] (empty slice) failed.")

    def test_slice_multiple(self):
        qs = list(Video.objects.all())
        qs = qs + qs + qs
        mqs = MultiQuerySet(Video.objects.all(),
                            Video.objects.all(),
                            Video.objects.all())

        self.assertEqual(qs[0:3],
                         list(mqs[0:3]),
                         "MQS[:3] failed.")

        self.assertEqual(qs[0:6],
                         list(mqs[0:6]),
                         "MQS[:6] (entire range) failed.")

        self.assertEqual(qs[0:7],
                         list(mqs[0:7]),
                         "MQS[:7] (out-of-bounds endpoint) failed.")

        self.assertEqual(qs[1:3],
                         list(mqs[1:3]),
                         "MQS[1:3] failed.")

        self.assertEqual(qs[1:6],
                         list(mqs[1:6]),
                         "MQS[1:6] (entire range) failed.")

        self.assertEqual(qs[1:7],
                         list(mqs[1:7]),
                         "MQS[1:7] (out-of-bounds endpoint) failed.")

        self.assertEqual(qs[3:3],
                         list(mqs[3:3]),
                         "MQS[3:3] failed.")

        self.assertEqual(qs[3:6],
                         list(mqs[3:6]),
                         "MQS[3:6] (entire range) failed.")

        self.assertEqual(qs[3:7],
                         list(mqs[3:7]),
                         "MQS[3:7] (out-of-bounds endpoint) failed.")

class LanguageCodeTest(TestCase):
    def test_encode(self):
        lc = LanguageCode('en', 'iso-639-1')

        self.assertEqual('en', lc.encode('iso-639-1'),
                         "Incorrect encoded value.")

        lc = LanguageCode('bm', 'iso-639-1')

        self.assertEqual('bm', lc.encode('iso-639-1'),
                         "Incorrect encoded value.")

        self.assertEqual('bam', lc.encode('unisubs'),
                         "Incorrect encoded value.")


    def test_aliases(self):
        lc = LanguageCode('bm', 'iso-639-1')
        aliases = lc.aliases()

        self.assertIn('iso-639-1', aliases,
                      "Alias not found.")
        self.assertIn('unisubs', aliases,
                      "Alias not found.")

        self.assertEqual('bm', aliases['iso-639-1'],
                         'Incorrect alias.')
        self.assertEqual('bam', aliases['unisubs'],
                         'Incorrect alias.')
