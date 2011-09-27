# Universal Subtitles, universalsubtitles.org
# 
# Copyright (C) 2010 Participatory Culture Foundation
# 
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.
# 
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
# 
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see 
# http://www.gnu.org/licenses/agpl-3.0.html.

DEV, STAGING, PRODUCTION = range(1, 4)

INSTALLATION = INSERT_INSTALLATION_HERE # one of DEV, STAGING, PRODUCTION

AWS_ACCESS_KEY_ID = ''
AWS_SECRET_ACCESS_KEY = ''
AWS_USER_DATA_BUCKET_NAME = 'INSERT USERDATA BUCKET'

# Celery broker settings
# (for RabbitMQ, only on staging for now)
#BROKER_BACKEND = 'amqplib'
#BROKER_HOST     = "INSERT BROKER HOST"
#BROKER_PASSWORD = "INSERT BROKER PASSWORD"
#BROKER_PORT     = INSERT BROKER PORT
#BROKER_USER     = "INSERT BROKER USER"
#BROKER_VHOST    = "INSERT BROKER VHOST"

CACHE_BACKEND = 'memcached://127.0.0.1:11211/'

DATABASE_HOST = 'INSERT DB HOST'
DATABASE_NAME = 'INSERT DATABASE NAME'
DATABASE_PASSWORD = 'INSERT DATABASE PASSWORD'
DATABASE_USER = 'INSERT DATABASE USER'

DEFAULT_BUCKET = '' # special note: should be blank for dev.
HAYSTACK_SOLR_URL = 'http://localhost:38983/solr'
MEDIA_URL = 'INSERT MEDIA_URL'
STATIC_URL = 'INSERT STATIC_URL'

PROMOTE_TO_ADMINS = []

RECAPTCHA_SECRET = ''

REDIS_HOST = 'INSERT REDIS HOST'
REDIS_PORT = INSERT REDIS PORT

SECRET_KEY = 'INSERT SITE SECRET KEY'

# SENTRY_* db settings only used on staging and production.
SENTRY_DATABASE_HOST = 'INSERT SENTRY DB HOST'
SENTRY_DATABASE_NAME = 'INSERT SENTRY DATABASE NAME'
SENTRY_DATABASE_PASSWORD = 'INSERT SENTRY DATABASE PASSWORD'
SENTRY_DATABASE_USER = 'INSERT SENTRY DATABASE USER'

TWITTER_CONSUMER_KEY = 'INSERT TWITTER CONSUMER KEY'
TWITTER_CONSUMER_SECRET = 'INSERT TWITTER CONSUMER SECRET'

FACEBOOK_API_KEY = 'INSERT FACEBOOK API KEY'
FACEBOOK_APP_ID = 'INSERT FACEBOOK APP ID'
FACEBOOK_SECRET_KEY = 'INSERT FACEBOOK SECRET KEY'

VIMEO_API_KEY = 'INSERT VIMEO API KEY'
VIMEO_API_SECRET = 'INSERT VIMEO API SECRET'
