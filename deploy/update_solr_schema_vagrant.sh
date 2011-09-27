#!/bin/bash

python manage.py build_solr_schema > /opt/solr/example/solr/conf/schema.xml

/etc/init.d/solr restart

# Give the server time to finish starting.
echo -n '.'; sleep 1
echo -n '.'; sleep 1
echo -n '.'; sleep 1
echo -n '.'; sleep 1
echo -n '.'; sleep 1

# For some reason Solr refuses connections unless we do this first.
wget 'http://localhost:8983/solr' -O /dev/null

python manage.py rebuild_index --settings=dev_settings
