from django.core.management import BaseCommand
from utils.amazon.fields import create_thumbnails
from boto.exception import S3ResponseError
from auth.models import CustomUser

class Command(BaseCommand):
    
    def handle(self, *args, **options):
        from teams.models import Team
        
        for team in Team.objects.exclude(logo=''):
            print team.logo, 
            try:
                create_thumbnails(team.logo, team.logo.file)
                print 'FIXED'
            except S3ResponseError:
                team.logo = ''
                team.save()
                print 'S3 ERROR'
                    
        for user in CustomUser.objects.exclude(picture=''):
            print user.picture,
            try:
                create_thumbnails(user.picture, user.picture.file)
                print 'FIXED'
            except S3ResponseError:
                user.picture = ''
                user.save()
                print 'S3 ERROR'                