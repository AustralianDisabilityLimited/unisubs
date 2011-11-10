#!/bin/bash

set -e

# Link folders ----------------------------------------------------------------
mkdir -p ../extras/static-cache
mkdir -p ../extras/pictures
mkdir -p ../extras/video
test -L venv               || ln -s ../extras/venv venv
test -L media/static-cache || ln -s ../../extras/static-cache media/static-cache
test -L user-data/video    || ln -s ../../extras/video user-data/video
test -L user-data/pictures || ln -s ../../extras/pictures user-data/pictures

# Install requirements --------------------------------------------------------
source venv/bin/activate
cd deploy
pip install -r requirements.txt
cd ..

# Set up the DB ---------------------------------------------------------------
python manage.py syncdb --all --settings=dev_settings --noinput
python manage.py migrate --fake --settings=dev_settings

# Solr-------------------------------------------------------------------------
sudo ./deploy/update_solr_schema_vagrant.sh

# Adjust sys.path -------------------------------------------------------------
cat >venv/lib/python2.6/sitecustomize.py <<EOF
import sys

try:
    sys.path.remove('/opt/extras/venv/lib/python2.6/site-packages')
except ValueError:
    pass

try:
    sys.path.remove('/usr/lib/python2.6')
except ValueError:
    pass

sys.path = ['/opt/extras/venv/lib/python2.6/site-packages', '/usr/lib/python2.6'] + sys.path
EOF

# Celery services -------------------------------------------------------------
sudo /etc/init.d/celeryd restart
sudo /etc/init.d/celerybeat restart

# Notice ----------------------------------------------------------------------
echo "========================================================================="
echo "Bootstrapping Complete"
echo ""
echo "For even better performance move the git directory away on your HOST OS:"
echo ""
echo "    mv .git ../unisubs.git && ln -s ../unisubs.git .git"
