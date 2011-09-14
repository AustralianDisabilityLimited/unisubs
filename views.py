from django.conf import settings
from recaptcha.client import captcha
from django.shortcuts import render_to_response
from videos.forms import  FeedbackForm

def get_feedback(request):
    form = FeedbackForm(request.POST, initial={'captcha': request.META['REMOTE_ADDR']})
    return render_to_response("videos/_feedback_form.html", {
            'form':form,
            'key': settings.RECAPTCHA_PUBLIC
            })
