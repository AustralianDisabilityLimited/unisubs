from celery.decorators import periodic_task
from statistic import st_sub_fetch_handler, st_video_view_handler, st_widget_view_statistic
from datetime import timedelta
from utils.celery_utils import task


@periodic_task(run_every=timedelta(hours=6))
#@periodic_task(run_every=timedelta(seconds=30))
def update_statistic(*args, **kwargs):
    st_sub_fetch_handler.migrate(verbosity=kwargs.get('verbosity', 1))
    st_video_view_handler.migrate(verbosity=kwargs.get('verbosity', 1))
    st_widget_view_statistic.migrate(verbosity=kwargs.get('verbosity', 1))


@task
def st_sub_fetch_handler_update(**kwargs):
    st_sub_fetch_handler.update(**kwargs)


@task
def st_video_view_handler_update(**kwargs):
    st_video_view_handler.update(**kwargs)


@task
def st_widget_view_statistic_update(**kwargs):
    st_widget_view_statistic.update(**kwargs)
