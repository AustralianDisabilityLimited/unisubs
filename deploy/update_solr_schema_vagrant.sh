#!/bin/bash

python manage.py build_solr_schema > /opt/solr/example/solr/conf/schema.xml

/etc/init.d/solr restart

python manage.py rebuild_index --noinput --settings=dev_settings
