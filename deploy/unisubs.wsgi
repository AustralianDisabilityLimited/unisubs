import sys, site, os
from os.path import join

PROJECT_ROOT = os.path.join(os.path.abspath(os.path.dirname(__file__)), '..', '..')
DEFAULT_LANGUAGE = 'en'

def rel(*x):
    return os.path.join(PROJECT_ROOT, *x)

prev_sys_path = list(sys.path)

site.addsitedir(rel('env/lib/python2.6/site-packages'))

sys.path.append(PROJECT_ROOT)
sys.path.append(rel('unisubs'))
sys.path.append(rel('unisubs', 'libs'))
sys.path.append(rel('unisubs', 'apps'))

sys.stdout = sys.stderr

new_sys_path = [p for p in sys.path if p not in prev_sys_path]
for item in new_sys_path:
    sys.path.remove(item)
sys.path[:0] = new_sys_path

import django.core.handlers.wsgi
os.environ['DJANGO_SETTINGS_MODULE'] = 'unisubs.unisubs_settings'
os.environ["CELERY_LOADER"] = "django"
application = django.core.handlers.wsgi.WSGIHandler()

handler = django.core.handlers.wsgi.WSGIHandler()
disabled_file_path = rel('unisubs', 'disabled')

def application(environ, start_response):
    if os.path.exists(disabled_file_path):
        start_response('200 OK', [('Content-type', 'text/html; charset=utf-8')])
        
        langs = environ.get('HTTP_ACCEPT_LANGUAGE', 'en').split(',')
        langs.append(DEFAULT_LANGUAGE)

        for lang in langs:
            lang = lang.split(';')[0].split('-')[0].lower()
            off_tpl_path = rel('unisubs', 'templates', 'off_template', '%s.html' % lang)
            if os.path.exists(off_tpl_path):
                break

        return open(off_tpl_path).read()        
    else:    
        return handler(environ, start_response)
