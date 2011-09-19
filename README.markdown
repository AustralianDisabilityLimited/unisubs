This repository is the code for the [Universal Subtitles][] project.

The full documentation can be found at
<http://dev.universalsubtitles.org/site-docs/>.

[Universal Subtitles]: http://universalsubtitles.org

Quick Start
-----------

To run the development version:

1. Git clone the repository:

        git clone git://github.com/8planes/pculture//unisubs.git unisubs

    Now the entire project will be in the unisubs directory.

2. Install [virtualenv](http://pypi.python.org/pypi/virtualenv).

3. (optional) Download and install the [virtualenv
   wrapper](http://www.doughellmann.com/projects/virtualenvwrapper/) bash functions.

4. Create a virtual environment and activate it.

    Here is how to do it *without* the virtualenv wrapper. Run these commands from
    the parent of the unisubs directory created in #1:

        $ virtualenv unisubs-env
        $ source unisubs-env/bin/activate

    If you're using the virtualenv wrapper (run from any directory):

        $ mkvirtualenv unisubs
        $ workon unisubs

5. Run:

        $ easy_install -U setuptools
        $ easy_install pip
        $ cd deploy
        # this is the unisubs directory you cloned from git, not the parent you created the virtualenv in.
        $ pip install -r requirements.txt

    **Note:** You'll need [Mercurial](http://hg-scm.org) installed to make this last
    command work.

    **Note 2:** If you do not have the MySQL bindings installed (MySQLdb) and wish to
    keep it that way, unisubs runs just fine on sqlite, just comment out the line
    `MySQL_python>=1.2.2` on `deploy/requirements.txt` before running this command.

6. Check out Google Closure into directory of your choice:

        svn checkout http://closure-library.googlecode.com/svn/trunk/ <directory>

    Then symlink `media/js/closure-library` to the checkout location. From the
    unisubs directory in step 1:

        $ cd media/js
        $ ln -s <google closure checkout directory> closure-library

7. Add `unisubs.example.com` to your hosts file, pointing at `127.0.0.1`.  This is
   necessary for Twitter oauth to work correctly.

8. From the unisubs directory created in step 1, first create the
   database with:

        python manage.py syncdb --all

    Then update the south migrations with

        python manage.py migrate --fake

    SQLLite warnings are okay. Then run the site with:

        ./dev-runserver.sh

    You can access the site at <http://unisubs.example.com:8000>.

9. (optional) If you want to run video searches locally, you need to set up Solr:

    1. [Download Solr](http://www.apache.org/dyn/closer.cgi/lucene/solr/) and unzip
       to `../buildout/parts/solr` (relative to this directory).

    2. Run `./manage.py run_solr` in one terminal that is dedicated to running the
       solr process.

    3. run `./manage.py` rebuild_index to update the index.

    4. That should be it, but in case you're interested there's a list of haystack
       commands at <http://docs.haystacksearch.org/dev/management_commands.html>

    5. If you want to install SOLR as a daemon on your Mac, please see
       <https://github.com/8planes/pculture//unisubs/wiki/Running-SOLR-as-a-daemon-on-Mac>

    6. For the setup relating linux distributions see
       <https://github.com/8planes/pculture//unisubs/wiki/Setting-up-solr-on-linux>

