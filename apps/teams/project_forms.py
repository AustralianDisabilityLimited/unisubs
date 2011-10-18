from django.forms.models import ModelForm
from django import forms

from teams.models import Project

class ProjectForm(ModelForm):
    
    class Meta:
        model = Project
        exclude = ("team", "order", "slug")
