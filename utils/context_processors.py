from django.conf import settings

def media(request):
    """
    Adds media-related context variables to the context.

    """
    return {'STATIC_URL': settings.STATIC_URL, "STATIC_URL_BASE": settings.STATIC_URL_BASE}
