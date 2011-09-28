from django.db.models import get_app
from django.conf import settings
from django.core.management import call_command
from django.core.management.base import BaseCommand
from haystack.management.commands.clear_index import Command as ClearCommand
from haystack.management.commands.update_index import Command as UpdateCommand
from utils.sets import OrderedSet

def _get_app_labels(apps):
    app_labels = []
    for app in apps:
        try:
            app_label = app.split('.')[-1]
            get_app(app_label)
            app_labels.append(app_label)
        except:
            pass

    return app_labels

PRIORITY_APPS = list(OrderedSet(_get_app_labels(['teams'])))
REMAINING_APPS = list(OrderedSet(a for a in _get_app_labels(settings.INSTALLED_APPS)
                            if a not in PRIORITY_APPS))


class Command(BaseCommand):
    help = "Rebuilds the search index from scratch in a useful order."
    option_list = BaseCommand.option_list + ClearCommand.base_options + UpdateCommand.base_options

    def handle(self, **options):
        verbose = options.get('verbosity', 1) >= 1

        call_command('clear_index', **options)

        if verbose:
            print "\nUpdating Priority Apps", '-' * 40
        for app in PRIORITY_APPS:
            call_command('update_index', app, **options)

        if verbose:
            print "\nUpdating Remaining Apps", '-' * 39
        call_command('update_index', *REMAINING_APPS, **options)
