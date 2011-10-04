#encoding:utf-8
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
from django.db import models
from unidecode import unidecode

from django.template.defaultfilters import slugify

def pan_slugify(value):
    """
    Does unicode transliteration before slugifying.
    This is helpful for most inputs. For example:
    cação -> cacao
    """
    return slugify(unidecode(value))

class PanSlugField(models.SlugField):

    def to_python(self, value):
        return pan_slugify(value)


    def get_prep_value(self, value):
        return pan_slugify(value)
