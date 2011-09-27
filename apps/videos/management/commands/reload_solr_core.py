from django.core.management.base import NoArgsCommand
from django.conf import settings
from urllib2 import urlopen

def _solr_info():
    '''Parse the HAYSTACK_SOLR_URL to determine the Solr host and core.'''
    url = settings.HAYSTACK_SOLR_URL

    url = url.replace('http://', '', 1)
    host = url.split('/', 1)[0]
    core = url.rsplit('/', 1)[-1]

    return host, core

class Command(NoArgsCommand):
    help = "Reloads the Solr core (which will reload the schema)."

    def handle_noargs(self, **options):
        host, core = _solr_info()
        reload_url = 'http://%s/solr/admin/cores?action=RELOAD&core=%s' % (host, core)
        print 'Reloading: %s' % reload_url
        print '-' * 78
        print urlopen(reload_url).read()
        print '-' * 78
        print 'Solr core %s reloaded' % core
