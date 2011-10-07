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
from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404
from django.utils.functional import  wraps

from icanhaz.projects import can_edit_project
from teams.models import Team, Project


def raise_forbidden_project(request):
    return HttpResponseForbidden("You cannot edit this project")
    
def edit_project_allowed(func):
    """
    Wraps a view with a signature such as
    view(request, slug, project_slug=None...)
    to -> view(request, team, project=None...),
    authorization credentials for viewing have been checked 
    for the user on that request.
    """
    def wrapper( self, team_slug, project_pk=None, *args, **kwargs):
        team = get_object_or_404(Team, slug=team_slug)
        project = None
        user = kwargs.pop("user")
        if project_pk is not None:
            project = get_object_or_404(Project, team=team, pk=project_pk)
        
        if not can_edit_project(user, team, project):
            return raise_forbidden_project(request)
        kwargs.update({
            "user": user,
            })

        return func( team, project, *args, **kwargs)
    return wraps(func)(wrapper)


