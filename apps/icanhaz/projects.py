def can_edit_project(user, team, project=None):
    # FIXME: implement this role based
    return team.is_manager(user)
