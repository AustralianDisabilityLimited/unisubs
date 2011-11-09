# Universal Subtitles, universalsubtitles.org
#
# Copyright (C) 2011 Participatory Culture Foundation
#
# This program is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, either version 3 of the License, or (at your option) any
# later version.
#
# This program is distributed in the hope that it will be useful, but WITHOUT
# ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
# FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License along
# with this program.  If not, see http://www.gnu.org/licenses/agpl-3.0.html.

from django import forms
from teams.models import Task


class FinishReviewForm(forms.Form):
    task = forms.ModelChoiceField(Task.objects.all())
    body = forms.CharField(max_length=1024, required=False)
    approved = forms.TypedChoiceField(choices=Task.APPROVED_CHOICES, coerce=int,
                                      empty_value=None)

    def __init__(self, request, *args, **kwargs):
        super(FinishReviewForm, self).__init__(*args, **kwargs)

        self.fields['task'].queryset = Task.objects.filter(
                deleted=False, completed=None, type=Task.TYPE_IDS['Review'],
                assignee=request.user)


class FinishApproveForm(forms.Form):
    task = forms.ModelChoiceField(Task.objects.all())
    body = forms.CharField(max_length=1024, required=False)
    approved = forms.TypedChoiceField(choices=Task.APPROVED_CHOICES, coerce=int,
                                      empty_value=None)

    def __init__(self, request, *args, **kwargs):
        super(FinishApproveForm, self).__init__(*args, **kwargs)

        self.fields['task'].queryset = Task.objects.filter(
                deleted=False, completed=None, type=Task.TYPE_IDS['Approve'],
                assignee=request.user)


