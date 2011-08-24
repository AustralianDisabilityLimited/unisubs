from django.utils.functional import  wraps
from django.conf import settings

flags = getattr(settings, "FEATURE_FLAGS", {})


def feature_is_on(feature_flag_name, request=None, *extra):
    """
    Determines if feature identified by `feature_flag_name` is on or off.

    The request might be passed in order to determine that - i.e.   we might
    want to read request.user and show a feature to admin users only
    """
    flag_status = flags.get( feature_flag_name, None)

    if callable(flag_status ):
        return flag_status(request, *extra)
    return bool(flag_status)

def when_feature(feature_flag_name=None, request=None):

    def _f(func):
        def wrapper(*args, **kwargs):

            if feature_is_on(feature_flag_name, request):
                return func(*args, **kwargs)
            return
        return wraps(func)(wrapper)
    return _f
