

def project_edit(request, team, project=None):
    if project:
        if request.method == "GET":
            form = ProjectForm(instance=project)
        else:
            data = request.POST.copy()
            data.update({"team":team})
            form = ProjectForm(instance=project, data=data)
            if form.is_valid():
                form.save()
    else:
        form = ProjectForm()
