from django.core.management import BaseCommand
from django.conf import settings
from videos.models import Video
from django.core.files.base import ContentFile
from urllib import urlopen

class Command(BaseCommand):
    
    def handle(self, *args, **options):
        if not getattr(settings, 'USE_AMAZON_S3', False):
            print u'Amazon S3 is not used'
            
        qs = Video.objects.exclude(thumbnail='').filter(s3_thumbnail='')
        count = qs.count()
        print 'TOTAL:', count
        i = 0
        for video in qs:
            i += 1
            if i % 100 == 0:
                print '%s of %s' % (i, count)
            content = ContentFile(urlopen(video.thumbnail).read())
            video.s3_thumbnail.save(video.thumbnail.split('/')[-1], content)              