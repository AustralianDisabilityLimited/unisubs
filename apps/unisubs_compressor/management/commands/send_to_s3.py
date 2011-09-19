"""
Sync Media to S3
================

Django command that scans all files in your settings.STATIC_ROOT + settings.COMPRESS_OUTPUT_DIRNAME + [git commit]  folder and uploads them to S3 with the same directory structure.

This command also does the following 
* gzip compress any CSS and Javascript files it finds and adds the appropriate
  'Content-Encoding' header.
* set a far future 'Expires' header for optimal caching.

Note: This script requires the Python boto library and valid Amazon Web
Services API keys.

Required settings.py variables:
AWS_ACCESS_KEY_ID = ''
AWS_SECRET_ACCESS_KEY = ''
AWS_BUCKET_NAME = ''

For example it wil sync anything in
STATIC_ROOT/static-cache/0234dsd/*


"""
import datetime
import email
import mimetypes
import optparse
import os
import sys
import time
import re

from django.core.management.base import BaseCommand, CommandError

# Make sure boto is available
try:
    import boto
    import boto.exception
except ImportError:
    raise ImportError, "The boto Python library is not installed."

from apps.unisubs_compressor.management.commands.compile_media import get_cache_dir
from deploy.git_helpers import get_current_commit_hash
from compile_media import NO_UNIQUE_URL

def add_far_future_expires(headers, verbose=False):
    # HTTP/1.0
    headers['Expires'] = '%s GMT' % (email.Utils.formatdate(
            time.mktime((datetime.datetime.now() +
                         datetime.timedelta(days=365*2)).timetuple())))
    # HTTP/1.1
    headers['Cache-Control'] = 'max-age %d' % (3600 * 24 * 365 * 2)
    if verbose:
        print "\texpires: %s" % (headers['Expires'])
        print "\tcache-control: %s" % (headers['Cache-Control'])

def add_no_cache(headers, verbose=False):
    headers['Cache-Control'] = 'no-store, no-cache, must-revalidate'
    headers['Pragma'] = 'no-cache'
    headers['Expires'] = '%s GMT' % (email.Utils.formatdate(
            time.mktime((datetime.datetime.now() +
                         datetime.timedelta(days=-30*365)).timetuple())))
    if verbose:
        print "\texpires: %s" % (headers['Expires'])
        print "\tcache-control: %s" % (headers['Cache-Control'])
        print "\tPragma: %s" % (headers['Pragma'])

class Command(BaseCommand):

    # Extra variables to avoid passing these around
    AWS_ACCESS_KEY_ID = ''
    AWS_SECRET_ACCESS_KEY = ''
    AWS_BUCKET_NAME = ''
    DIRECTORY = ''
    FILTER_LIST = [re.compile(x) for x in ['\.DS_Store', "^videos.+","^js\/closure-lib" , "^teams", "^test", "^videos"]]

    GZIP_CONTENT_TYPES = (
        'text/css',
        'application/javascript',
        'application/x-javascript'
    )

    upload_count = 0
    skip_count = 0

    option_list = BaseCommand.option_list + (
        optparse.make_option('-p', '--prefix',
            dest='prefix', default='',
            help="The prefix to prepend to the path on S3."),
        optparse.make_option('--gzip',
            action='store_true', dest='gzip', default=True,
            help="Enables gzipping CSS and Javascript files."),
        optparse.make_option('--expires',
            action='store_true', dest='expires', default=True,
            help="Enables setting a far future expires header."),
        optparse.make_option('--force',
            action='store_true', dest='force', default=True,
            help="Skip the file mtime check to force upload of all files.")
    )

    help = 'Syncs the complete STATIC_ROOT structure and files to S3 into the given bucket name.'
    args = 'bucket_name'

    can_import_settings = True

    def handle(self, *args, **options):
        from django.conf import settings


        if not hasattr(settings, 'STATIC_ROOT'):
            raise CommandError('STATIC_ROOT must be set in your settings.')
        else:
            if not settings.STATIC_ROOT:
                raise CommandError('STATIC_ROOT must be set in your settings.')
        self.DIRECTORY = get_cache_dir()
        # Check for AWS keys in settings
        if not hasattr(settings, 'AWS_ACCESS_KEY_ID') or \
           not hasattr(settings, 'AWS_SECRET_ACCESS_KEY'):
           raise CommandError('Missing AWS keys from settings file.  Please' +
                     'supply both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.')
        else:
            self.AWS_ACCESS_KEY_ID = settings.AWS_ACCESS_KEY_ID
            self.AWS_SECRET_ACCESS_KEY = settings.AWS_SECRET_ACCESS_KEY

        if not hasattr(settings, 'AWS_BUCKET_NAME'):
            raise CommandError('Missing bucket name from settings file. Please' +
                ' add the AWS_BUCKET_NAME to your settings file.')
        else:
            if not settings.AWS_BUCKET_NAME:
                raise CommandError('AWS_BUCKET_NAME cannot be empty.')
        self.AWS_BUCKET_NAME = settings.AWS_BUCKET_NAME 
        self.verbosity = int(options.get('verbosity'))
        self.prefix = options.get('prefix')
        if bool(self.prefix) is False:
            self.prefix = os.path.join(settings.COMPRESS_OUTPUT_DIRNAME, get_current_commit_hash())
        self.do_gzip = options.get('gzip')
        self.do_expires = options.get('expires')
        self.do_force = options.get('force')

        # Now call the syncing method to walk the STATIC_ROOT directory and
        # upload all files found.
        self.sync_s3()

        print
        print "%d files uploaded." % (self.upload_count)
        print "%d files skipped." % (self.skip_count)

    def sync_s3(self):
        """
        Walks the media directory and syncs files to S3
        """
        bucket, key = self.open_s3()
        os.path.walk(self.DIRECTORY, self.upload_s3,
            (bucket, key, self.AWS_BUCKET_NAME, self.DIRECTORY))
         
        old_prefix = self.prefix
        self.prefix = ""

        self.sync_no_unique_url_items(bucket, key)

        self.prefix = old_prefix

    def sync_no_unique_url_items(self, bucket, key):
        from django.conf import settings
        outside_dir = os.path.dirname(self.DIRECTORY)

        def upload_no_unique_url_item(file_name):
            fname = os.path.basename(file_name)
            base_dir = os.path.join(settings.STATIC_ROOT, os.path.dirname(file_name))
            full_path = os.path.join(settings.STATIC_ROOT, file_name)
            self.upload_one(
                bucket, key, self.AWS_BUCKET_NAME, outside_dir, full_path, file_name,
                add_no_cache if item['no-cache'] else None)

        # these are not to be prefixed by commit, e.g. outside systems link to them
        no_unique_url_items = NO_UNIQUE_URL
        # embed.js is a special case :(
        no_unique_url_items += ({ "name": "embed.js", "no-cache": True },)
        for item in no_unique_url_items:
            file_name = item['name']
            upload_no_unique_url_item(file_name)
            # for backwards compatibility with old mirosubs names
            mirosubs_filename = re.sub(r'unisubs\-', 'mirosubs-', file_name)
            if file_name != mirosubs_filename:
                upload_no_unique_url_item(mirosubs_filename)

    def compress_string(self, s):
        """Gzip a given string."""
        import cStringIO, gzip
        zbuf = cStringIO.StringIO()
        zfile = gzip.GzipFile(mode='wb', compresslevel=6, fileobj=zbuf)
        zfile.write(s)
        zfile.close()
        return zbuf.getvalue()

    def open_s3(self):
        """
        Opens connection to S3 returning bucket and key
        """
        conn = boto.connect_s3(self.AWS_ACCESS_KEY_ID, self.AWS_SECRET_ACCESS_KEY)
        try:
            bucket = conn.get_bucket(self.AWS_BUCKET_NAME)
        except boto.exception.S3ResponseError:
            bucket = conn.create_bucket(self.AWS_BUCKET_NAME)
        return bucket, boto.s3.key.Key(bucket)

    def upload_s3(self, arg, dirname, names):
        """
        This is the callback to os.path.walk and where much of the work happens
        """
        bucket, key, bucket_name, root_dir = arg # expand arg tuple

        if root_dir == dirname:
            return # We're in the root media folder

        # Later we assume the STATIC_ROOT ends with a trailing slash
        # TODO: Check if we should check os.path.sep for Windows
        if not root_dir.endswith('/'):
            root_dir = root_dir + '/'

        for file in names:
            filename = os.path.join(dirname, file)
            for p in self.FILTER_LIST:
                if p.match(file) or p.match(filename):
                    print "not uplodaing! filtering ", file
                    continue # Skip files we don't want to sync

            if os.path.isdir(filename):
                continue # Don't try to upload directories

            
            file_key = filename[len(root_dir):]
            if self.prefix:
                file_key = '%s/%s' % (self.prefix, file_key)
                           
            cache_strategy = None
            if self.do_expires:
                cache_strategy = add_far_future_expires
            self.upload_one(bucket, key, bucket_name, root_dir, filename, file_key, cache_strategy)                    


    def upload_one(self, bucket, key, bucket_name, root_dir, filename, 
                   file_key, cache_strategy=None):
        if self.verbosity > 0:
            print "Uploading %s..." % (file_key)
        headers = {}
        content_type = mimetypes.guess_type(filename)[0]
        if content_type:
            headers['Content-Type'] = content_type
        file_obj = open(filename, 'rb')
        file_size = os.fstat(file_obj.fileno()).st_size
        filedata = file_obj.read()
        if self.do_gzip:
            # Gzipping only if file is large enough (>1K is recommended) 
            # and only if file is a common text type (not a binary file)
            if file_size > 1024 and content_type in self.GZIP_CONTENT_TYPES:
                filedata = self.compress_string(filedata)
                headers['Content-Encoding'] = 'gzip'
                if self.verbosity > 1:
                    print "\tgzipped: %dk to %dk" % \
                        (file_size/1024, len(filedata)/1024)
        if cache_strategy is not None:
            cache_strategy(headers, self.verbosity > 1)

        try:
            key.name = file_key
            key.set_contents_from_string(filedata, headers, replace=True)
            key.make_public()
        except boto.s3.connection.BotoClientError, e:
            print "Failed: %s" % e
        except Exception, e:
            print e
            raise
        else:
            self.upload_count += 1

        file_obj.close()

# Backwards compatibility for Django r9110
if not [opt for opt in Command.option_list if opt.dest=='verbosity']:
    Command.option_list += (
        optparse.make_option('-v', '--verbosity',
            dest='verbosity', default=1, action='count',
            help="Verbose mode. Multiple -v options increase the verbosity."),
    )
