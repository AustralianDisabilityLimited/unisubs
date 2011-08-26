from django.core.management import BaseCommand
from django.conf import settings
from auth.models import CustomUser as User
from videos.models import Video
from boto.s3.connection import S3Connection
from boto.s3.key import Key

PRODUCTION_BUCKET = getattr(settings, 'PRODUCTION_BUCKET', None)

class Command(BaseCommand):
    
    def handle(self, *args, **options):
        verbosity = options.get('verbosity', 2)
        
        if settings.USE_AMAZON_S3 and PRODUCTION_BUCKET:
            self.copy_bucket(verbosity)
        else:
            self.fix_media(verbosity)
            
    def copy_bucket(self, verbosity=1):
        if verbosity >= 1:
            print 'Copy production bucket...'
                        
        connection = S3Connection(settings.AWS_ACCESS_KEY_ID, settings.AWS_SECRET_ACCESS_KEY)
        bucket = connection.lookup(settings.DEFAULT_BUCKET)
        production_bucket = connection.lookup(PRODUCTION_BUCKET)
        
        if not bucket:
            if verbosity >= 1:
                print 'Bucket does not exist'
            return 
        
        if not production_bucket:
            if verbosity >= 1:
                print 'Production bucket does not exist'
            return             
        
        for key in production_bucket.list():
            key.copy(settings.DEFAULT_BUCKET, key.name)
        
    def fix_media(self, verbosity=1):
        """
        Just clean images field to have default images defined by site design.
        """
        if verbosity >= 1:
            print 'Clean images fields...'
                    
        from teams.models import Team, TeamVideo
        
        User.objects.update(picture='')
        Video.objects.update(s3_thumbnail='')
        Team.objects.update(logo='')
        TeamVideo.objects.update(thumbnail='')