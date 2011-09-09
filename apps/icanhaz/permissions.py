def user_can_change_visibility(user, video):
    return user.has_perm("change_visibility", video)

def video_has_owner(video):
    
