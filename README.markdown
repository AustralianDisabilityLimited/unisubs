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

2. Install VirtualBox if you don't have it yet. Then type:

       vagrant up

   This is going to create a vm and provision it. It should take 10-15 minutes. 
   Remember what mom said: a watched pot never boils.

3. Run following commands:

       vagrant ssh
       cd /opt/unisubs
       source venv/bin/activate
       python manage.py syncdb --all --settings=dev_settings
       python manage.py migrate --fake --settings=dev_settings

4. Check out Google Closure into directory of your choice:

        svn checkout http://closure-library.googlecode.com/svn/trunk/ <directory>

    Then symlink `media/js/closure-library` to the checkout location. From the
    unisubs directory in step 1:

        $ cd media/js
        $ ln -s <google closure checkout directory> closure-library

5. Add `unisubs.example.com` to your hosts file, pointing at `127.0.0.1`.  This is
   necessary for Twitter oauth to work correctly.

6. Run the site with:

        ./dev-runserver.sh

    You can access the site at <http://unisubs.example.com:8000>.

-- IGNORE THE FOLLOWING FOR RIGHT NOW. UNDER CONSTRUCTION. --



9. (optional) If you want to view video listings and run video searches locally, you
   need to set up Solr:

    1. [Download Solr](http://www.apache.org/dyn/closer.cgi/lucene/solr/) and unzip
       to `../buildout/parts/solr` (relative to this directory).

    2. Replace the contents of `../buildout/parts/solr/example/solr/solr.xml` with:

            <solr persistent="true" sharedLib="lib">
                <cores adminPath="/admin/cores">
                    <core name="core0" instanceDir="." >
                        <property name="dataDir" value="/data/core0" />
                    </core>
                    <core name="core1" instanceDir="." >
                        <property name="dataDir" value="/data/core1" />
                    </core>
                </cores>
            </solr>

    3. Run `./manage.py run_solr --settings=dev_settings` in one terminal that is
       dedicated to running the Solr process.

    4. Run `./manage.py rebuild_index --settings=dev_settings` to update the index.

    5. That should be it, but in case you're interested there's a list of haystack
       commands at <http://docs.haystacksearch.org/dev/management_commands.html>

    6. If you want to install SOLR as a daemon on your Mac, please see
       <https://github.com/8planes/pculture//unisubs/wiki/Running-SOLR-as-a-daemon-on-Mac>

    7. For the setup relating linux distributions see
       <https://github.com/8planes/pculture//unisubs/wiki/Setting-up-solr-on-linux>

