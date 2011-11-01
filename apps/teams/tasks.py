from celery.task import task
from utils import send_templated_email
from django.contrib.sites.models import Site
from django.conf import settings
from celery.decorators import periodic_task
from celery.schedules import crontab
from datetime import datetime
from django.db.models import F
from django.utils.translation import ugettext_lazy as _
from haystack import site

@periodic_task(run_every=crontab(minute=0, hour=6))
def add_videos_notification(*args, **kwargs):
    from teams.models import TeamVideo, Team
    domain = Site.objects.get_current().domain
    
    qs = Team.objects.filter(teamvideo__created__gt=F('last_notification_time')).distinct()
    
    for team in qs:
        team_videos = TeamVideo.objects.filter(team=team, created__gt=team.last_notification_time)

        team.last_notification_time = datetime.now()
        team.save()

        members = team.users.filter(changes_notification=True, is_active=True) \
            .filter(user__changes_notification=True).distinct()

        subject = _(u'New %(team)s videos ready for subtitling!') % dict(team=team)

        for user in members:
            if not user.email:
                continue

            context = {
                'domain': domain,
                'user': user,
                'team': team,
                'team_videos': team_videos,
                "STATIC_URL": settings.STATIC_URL,
            }

            send_templated_email(user.email, subject, 
                                 'teams/email_new_videos.html',
                                 context, fail_silently=not settings.DEBUG)


@task()
def update_one_team_video(team_video_id):
    from teams.models import TeamVideo
    try:
        team_video = TeamVideo.objects.get(id=team_video_id)
    except TeamVideo.DoesNotExist:
        return

    tv_search_index = site.get_index(TeamVideo)
    tv_search_index.backend.update(
        tv_search_index, [team_video])


@task()
def complete_applicable_tasks(team_video_id):
    from teams.models import TeamVideo, Task

    try:
        team_video = TeamVideo.objects.get(id=team_video_id)
    except TeamVideo.DoesNotExist:
        return

    incomplete_tasks = team_video.task_set.filter(completed__isnull=True)

    completed_languages = team_video.video.completed_subtitle_languages()
    subtitle_complete = any([sl.is_original and sl.is_complete
                             for sl in completed_languages])
    translate_complete = [sl.language for sl in completed_languages]
    review_complete = []
    approve_complete = []

    for t in incomplete_tasks:
        should_complete = (
            (t.type == Task.TYPE_IDS['Subtitle'] and subtitle_complete)
            or (t.type == Task.TYPE_IDS['Translate']
                and t.language in translate_complete)
            or (t.type == Task.TYPE_IDS['Review']
                and t.language in review_complete)
            or (t.type == Task.TYPE_IDS['Approve']
                and t.language in approve_complete)
        )
        if should_complete:
            t.complete()

