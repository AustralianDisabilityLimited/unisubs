This repository is the code for the [Universal Subtitles][] project.

The full documentation can be found at
<http://dev.universalsubtitles.org/site-docs/>.

[Universal Subtitles]: http://universalsubtitles.org

Quick Start
-----------

To run the development version:

1. Git clone the repository:

        git clone git://github.com/pculture/unisubs.git unisubs

    Now the entire project will be in the unisubs directory.

2. Install VirtualBox and vagrant if you don't have them yet. Then type:

        vagrant up

    This is going to create a vm and provision it. It should take 10-15 minutes.
    Remember what mom said: a watched pot never boils.

3. Switch over to your vagrant vm with:

        vagrant ssh

    Then run following commands:

        cd /opt/unisubs
        source venv/bin/activate
        python manage.py syncdb --all --settings=dev_settings
        python manage.py migrate --fake --settings=dev_settings
        sudo ./deploy/update_solr_schema_vagrant.sh

4. Add `unisubs.example.com` to your hosts file, pointing at `127.0.0.1`.  This
   is necessary for Twitter and Facebook oauth to work correctly.

5. In your vagrant vm (the one you switched to in step 3), run the site with:

        ./dev-runserver.sh

    You can access the site at <http://unisubs.example.com:8000>.

## Optional

You can optionally set up a few other pieces of the development environment that
we haven't automated yet.

### RabbitMQ and Celery

Add the following to `settings_local.py` to use RabbitMQ and Celery for async
tasks:

    CELERY_ALWAYS_EAGER = False
    CELERY_RESULT_BACKEND = "amqp"
    BROKER_BACKEND = 'amqplib'
    BROKER_HOST = "localhost"
    BROKER_PORT = 5672
    BROKER_USER = "usrmquser"
    BROKER_PASSWORD = "usrmqpassword"
    BROKER_VHOST = "ushost"

