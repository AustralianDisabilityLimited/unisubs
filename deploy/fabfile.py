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

from __future__ import with_statement

import os, sys, string, random
import fabric.colors as colors
from fabric.api import run, sudo, env, cd, local as _local
from fabric.context_managers import settings
from fabric.utils import fastprint


# Output Management -----------------------------------------------------------
PASS_THROUGH = ('sudo password: ', 'Sorry, try again.')
class CustomFile(file):
    def __init__(self, *args, **kwargs):
        self.log = ""
        return super(CustomFile, self).__init__(*args, **kwargs)

    def _record(self, s):
        self.log = self.log[-255:] + s.lower()

        if any(pt in self.log for pt in PASS_THROUGH):
            sys.__stdout__.write('\n' + self.log.rsplit('\n', 1)[-1])
            self.log = ""

    def write(self, s, *args, **kwargs):
        self._record(s)
        return super(CustomFile, self).write(s, *args, **kwargs)


_out_log = CustomFile('fabric.log', 'w')
class Output(object):
    def __init__(self, message=""):
        self.message = message

    def __enter__(self):
        if self.message:
            fastprint(colors.white(self.message.ljust(60) + " -> ", bold=True))

        sys.stdout = _out_log
        sys.stderr = _out_log

        if self.message:
            fastprint("\n\n")
            fastprint(colors.yellow("+" + "-" * 78 + "+\n", bold=True))
            fastprint(colors.yellow("| " + self.message.ljust(76) + " |\n", bold=True))
            fastprint(colors.yellow("+" + "-" * 78 + "+\n", bold=True))

        return self

    def __exit__(self, type, value, tb):
        sys.stdout = sys.__stdout__
        sys.stderr = sys.__stderr__
        if type is None:
            fastprint(colors.green("OK\n", bold=True))
        else:
            fastprint(colors.red("FAILED\n", bold=True))
            fastprint(colors.red(
                "\nThere was an error.  "
                "See ./fabric.log for the full transcript of this run.\n",
                bold=True))

    def fastprint(self, s):
        sys.stdout = sys.__stdout__
        fastprint(s)
        sys.stdout = _out_log

    def fastprintln(self, s):
        self.fastprint(s + '\n')


def local(*args, **kwargs):
    '''Override Fabric's local() to facilitate output logging.'''
    capture = kwargs.get('capture')

    kwargs['capture'] = True
    out = _local(*args, **kwargs)

    if capture:
        return out
    else:
        print out


#:This environment is responsible for:
#:
#:- syncdb on all environment
#:- memechached and solr for `dev`
#:- media compilation on all environments
DEV_HOST = 'dev.universalsubtitles.org:2191'
#: Environment where celeryd and solr run for staging
#: - solr, celeryd and memcached for staging and production
ADMIN_HOST = 'pcf-us-admin.pculture.org:2191'

def _create_env(username, hosts, s3_bucket,
                installation_dir, static_dir, name,
                memcached_bounce_cmd,
                admin_dir, celeryd_host, celeryd_proj_root,
                separate_uslogging_db=False,
                celeryd_bounce_cmd="",
                web_dir=None):
    env.user = username
    env.web_hosts = hosts
    env.hosts = []
    env.s3_bucket = s3_bucket
    env.web_dir = web_dir or '/var/www/{0}'.format(installation_dir)
    env.static_dir = static_dir
    env.installation_name = name
    env.memcached_bounce_cmd = memcached_bounce_cmd
    env.admin_dir = admin_dir
    env.separate_uslogging_db = separate_uslogging_db
    env.celeryd_bounce_cmd=celeryd_bounce_cmd
    env.celeryd_host = celeryd_host
    env.celeryd_proj_root = celeryd_proj_root

def staging(username):
    _create_env(username              = username,
                hosts                 = ['pcf-us-staging1.pculture.org:2191',
                                         'pcf-us-staging2.pculture.org:2191',
                                         'pcf-us-staging3.pculture.org:2191'],
                s3_bucket             = 's3.staging.universalsubtitles.org',
                installation_dir      = 'universalsubtitles.staging',
                static_dir            = '/var/static/staging',
                name                  = 'staging',
                memcached_bounce_cmd  = '/etc/init.d/memcached-staging restart',
                admin_dir             = '/usr/local/universalsubtitles.staging',
                celeryd_host          = ADMIN_HOST,
                celeryd_proj_root     = 'universalsubtitles.staging',
                separate_uslogging_db = True,
                celeryd_bounce_cmd    = "/etc/init.d/celeryd.staging restart")

def dev(username):
    _create_env(username              = username,
                hosts                 = ['dev.universalsubtitles.org:2191'],
                s3_bucket             = None,
                installation_dir      = 'universalsubtitles.dev',
                static_dir            = '/var/www/universalsubtitles.dev',
                name                  = 'dev',
                memcached_bounce_cmd  = '/etc/init.d/memcached restart',
                admin_dir             = None,
                celeryd_host          = DEV_HOST,
                celeryd_proj_root     = 'universalsubtitles.dev',
                separate_uslogging_db = False,
                celeryd_bounce_cmd    = "/etc/init.d/celeryd.dev restart")

def unisubs(username):
    _create_env(username              = username,
                hosts                 = ['pcf-us-cluster1.pculture.org:2191',
                                        'pcf-us-cluster2.pculture.org:2191'],
                s3_bucket             = 's3.www.universalsubtitles.org',
                installation_dir      = 'universalsubtitles',
                static_dir            = '/var/static/production',
                name                  =  None,
                memcached_bounce_cmd  = '/etc/init.d/memcached restart',
                admin_dir             = '/usr/local/universalsubtitles',
                celeryd_host          = ADMIN_HOST,
                celeryd_proj_root     = 'universalsubtitles',
                separate_uslogging_db = True,
                celeryd_bounce_cmd    = "/etc/init.d/celeryd restart")


def syncdb():
    with Output("Syncing database"):
        env.host_string = DEV_HOST
        with cd(os.path.join(env.static_dir, 'unisubs')):
            _git_pull()
            run('{0}/env/bin/python manage.py syncdb '
                '--settings=unisubs_settings'.format(env.static_dir))
            if env.separate_uslogging_db:
                run('{0}/env/bin/python manage.py syncdb '
                    '--database=uslogging --settings=unisubs_settings'.format(
                        env.static_dir))

def migrate(app_name=''):
    with Output("Performing migrations"):
        env.host_string = DEV_HOST
        with cd(os.path.join(env.static_dir, 'unisubs')):
            _git_pull()
            if env.separate_uslogging_db:
                run('{0}/env/bin/python manage.py migrate sentry '
                    '--database=uslogging --settings=unisubs_settings'.format(
                        env.static_dir))
                run('{0}/env/bin/python manage.py migrate uslogging '
                    '--database=uslogging --settings=unisubs_settings'.format(
                        env.static_dir))
            run('yes no | {0}/env/bin/python manage.py migrate {1} --settings=unisubs_settings'.format(
                    env.static_dir, app_name))

def run_command(command):
    '''Run a python manage.py command'''
    cmdname = command.split(' ', 1)[0]
    with Output("Running python manage.py {0} ...".format(cmdname)):
        env.host_string = DEV_HOST
        with cd(os.path.join(env.static_dir, 'unisubs')):
            _git_pull()
            run('{0}/env/bin/python manage.py {1} '
                '--settings=unisubs_settings'.format(env.static_dir, command))

def migrate_fake(app_name):
    '''Fake a migration to 0001 for the specified app

    Unfortunately, one must do this when moving an app to South for the first
    time.

    See http://south.aeracode.org/docs/convertinganapp.html and
    http://south.aeracode.org/ticket/430 for more details. Perhaps this will be
    changed in a subsequent version, but now we're stuck with this solution.

    '''
    with Output("Faking migration for {0}".format(app_name)):
        env.host_string = DEV_HOST
        with cd(os.path.join(env.static_dir, 'unisubs')):
            run('yes no | {0}/env/bin/python manage.py migrate {1} 0001 --fake --settings=unisubs_settings'.format(env.static_dir, app_name))

def refresh_db():
    env.host_string = env.web_hosts[0]
    sudo('/scripts/univsubs_reset_db.sh {0}'.format(env.installation_name))
    sudo('/scripts/univsubs_refresh_db.sh {0}'.format(env.installation_name))
    promote_django_admins()
    bounce_memcached()
    run('{0}/env/bin/python manage.py fix_static_files '
        '--settings=unisubs_settings'.format(env.static_dir))

def update_closure():
    # this happens so rarely, it's not really worth putting it here.
    pass

def _switch_branch(dir, branch_name):
    with cd(os.path.join(dir, 'unisubs')):
        _git_pull()
        run('git fetch')
        # the following command will harmlessly fail if branch already exists.
        # don't be intimidated by the one-line message.
        with settings(warn_only=True):
            run('git branch --track {0} origin/{0}'.format(branch_name))
            run('git checkout {0}'.format(branch_name))
        _git_pull()

def _execute_on_all_hosts(cmd):
    for host in env.web_hosts:
        env.host_string = host
        cmd(env.web_dir)
    env.host_string = DEV_HOST
    cmd(env.static_dir)
    if env.admin_dir is not None:
        env.host_string = ADMIN_HOST
        cmd(env.admin_dir)

def switch_branch(branch_name):
    _execute_on_all_hosts(lambda dir: _switch_branch(dir, branch_name))

def _remove_pip_package(base_dir, package_name):
    with cd(os.path.join(base_dir, 'unisubs', 'deploy')):
        run('yes y | {0}/env/bin/pip uninstall {1}'.format(base_dir, package_name), pty=True)

def remove_pip_package(package_egg_name):
    _execute_on_all_hosts(lambda dir: _remove_pip_package(dir, package_egg_name))

def _update_environment(base_dir, flags=''):
    with cd(os.path.join(base_dir, 'unisubs', 'deploy')):
        _git_pull()
        run('export PIP_REQUIRE_VIRTUALENV=true')
        # see http://lincolnloop.com/blog/2010/jul/1/automated-no-prompt-deployment-pip/
        sudo('yes i | {0}/env/bin/pip install {1} -E {0}/env/ -r requirements.txt'.format(base_dir, flags), pty=True)

def update_environment(flags=''):
    with Output("Updating virtualenv"):
        _execute_on_all_hosts(lambda dir: _update_environment(dir, flags))

def _clear_permissions(dir):
    sudo('chgrp pcf-web -R {0}'.format(dir))
    sudo('chmod g+w -R {0}'.format(dir))

def clear_environment_permissions():
    _execute_on_all_hosts(
        lambda dir: _clear_permissions(os.path.join(dir, 'env')))

def clear_permissions():
    with Output("Clearing permissions"):
        for host in env.web_hosts:
            env.host_string = host
            _clear_permissions('{0}/unisubs'.format(env.web_dir))


def _git_pull():
    run('git checkout --force')
    run('git pull --rebase')
    run('chgrp pcf-web -R .git 2> /dev/null; /bin/true')
    run('chmod g+w -R .git 2> /dev/null; /bin/true')
    _clear_permissions('.')

def _git_checkout(commit):
    run('git fetch')
    run('git checkout --force %s' % commit)
    run('chgrp pcf-web -R .git 2> /dev/null; /bin/true')
    run('chmod g+w -R .git 2> /dev/null; /bin/true')
    _clear_permissions('.')


def _get_optional_repo_version(repo):
    with open(os.path.join(env.web_dir, 'unisubs', 'optional', repo)) as f:
        return f.read().strip()


def _reload_app_server(dir=None):
    """
    Reloading the app server will both make sure we have a
    valid commit guid (by running the create_commit_file)
    and also that we make the server reload code (currently
    with mod_wsgi this is touching the wsgi file)
    """
    with cd('{0}/unisubs'.format(dir or env.web_dir)):
        run('python deploy/create_commit_file.py')
        run('touch deploy/unisubs.wsgi')

def reload_app_servers():
    for host in env.web_hosts:
        env.host_string = host
        _reload_app_server()
    
def add_disabled():
    for host in env.web_hosts:
        env.host_string = host
        run('touch {0}/unisubs/disabled'.format(env.web_dir))

def remove_disabled():
    for host in env.web_hosts:
        env.host_string = host
        run('rm {0}/unisubs/disabled'.format(env.web_dir))

def update_integration():
    '''Update the integration repo to the version recorded in the site repo.

    At the moment it is assumed that the optional/unisubs-integration file
    exists, and that the unisubs-integration repo has already been cloned down.

    TODO: Run this from update_web automatically
    '''
    commit = _get_optional_repo_version('unisubs-integration')
    with cd(os.path.join(env.web_dir, 'unisubs', 'unisubs-integration')):
        _git_checkout(commit)

def update_web():
    """
    This is how code gets reloaded:

    - Checkout code on the auxiliary server ADMIN whost
    - Checkout the latest code on all appservers
    - Remove all pyc files from app servers
    - Bounce celeryd, memcached , test services
    - Reload app code (touch wsgi file)

    Until we implement the checking out code to an isolated dir
    any failure on these steps need to be fixed or will result in
    breakage
    """
    if env.admin_dir is not None:
        env.host_string = ADMIN_HOST
        with cd(os.path.join(env.admin_dir, 'unisubs')):
            _git_pull()
    for host in env.web_hosts:
        env.host_string = host
        with cd('{0}/unisubs'.format(env.web_dir)):
            _git_pull()
            with settings(warn_only=True):
                run("find . -name '*.pyc' -print0 | xargs -0 rm")
    _bounce_celeryd()
    bounce_memcached()
    test_services()
    for host in env.web_hosts:
        env.host_string = host
        _reload_app_server()

def bounce_memcached():
    '''Bounce the memcached server (purging the cache)

    Should be done by the end of each deploy

    '''
    with Output("Bouncing memcached"):
        if env.admin_dir:
            env.host_string = ADMIN_HOST
        else:
            env.host_string = DEV_HOST
        sudo(env.memcached_bounce_cmd, pty=False)

def update_solr_schema():
    '''Update the Solr schema and rebuild the index.

    The rebuilding will be done asynchronously with screen and an email will
    be sent when it finishes.

    '''
    with Output("Updating Solr schema"):
        if env.admin_dir:
            # staging and production
            env.host_string = ADMIN_HOST
            dir = env.admin_dir
            python_exe = '{0}/env/bin/python'.format(env.admin_dir)
            with cd(os.path.join(dir, 'unisubs')):
                _git_pull()
                run('{0} manage.py build_solr_schema --settings=unisubs_settings > /etc/solr/conf/{1}/conf/schema.xml'.format(
                        python_exe,
                        'production' if env.installation_name is None else 'staging'))
                run('{0} manage.py reload_solr_core --settings=unisubs_settings'.format(python_exe))
        else:
            # dev
            env.host_string = DEV_HOST
            dir = env.web_dir
            python_exe = '{0}/env/bin/python'.format(env.web_dir)
            with cd(os.path.join(dir, 'unisubs')):
                _git_pull()
                run('{0} manage.py build_solr_schema --settings=unisubs_settings > /etc/solr/conf/main/conf/schema.xml'.format(python_exe))
                run('{0} manage.py build_solr_schema --settings=unisubs_settings > /etc/solr/conf/testing/conf/schema.xml'.format(python_exe))
            sudo('service tomcat6 restart')

        run('screen -d -m sh -c "{0} {1} rebuild_index_ordered --noinput --settings=unisubs_settings | mail -s Solr_index_rebuilt_on_{2}  universalsubtitles-dev@pculture.org"'.format(python_exe, os.path.join(dir, 'unisubs', 'manage.py'), env.host_string))

def _bounce_celeryd():
    if env.admin_dir:
        env.host_string = ADMIN_HOST
    else:
        env.host_string = DEV_HOST
    if bool(env.celeryd_bounce_cmd):
        sudo(env.celeryd_bounce_cmd, pty=False)

def _update_static(dir):
    with cd(os.path.join(dir, 'unisubs')):
        media_dir = '{0}/unisubs/media/'.format(dir)
        python_exe = '{0}/env/bin/python'.format(dir)
        _git_pull()
        _clear_permissions(media_dir)
        run('{0} manage.py  compile_media --settings=unisubs_settings'.format(python_exe))

def update_static():
    with Output("Updating static media"):
        env.host_string = DEV_HOST
        if env.s3_bucket is not None:
            with cd(os.path.join(env.static_dir, 'unisubs')):
                _update_static(env.static_dir)
                python_exe = '{0}/env/bin/python'.format(env.static_dir)
                run('{0} manage.py  send_to_s3 --settings=unisubs_settings'.format(python_exe))
        else:
            _update_static(env.web_dir)

def update():
    update_static()
    update_web()

def _promote_django_admins(dir, email=None, new_password=None, userlist_path=None):
    with cd(os.path.join(dir, 'unisubs')):
        python_exe = '{0}/env/bin/python'.format(dir)
        args = ""
        if email is not None:
            args += "--email=%s" % (email)
        if new_password is not None:
            args += "--pass=%s" % (new_password)
        if userlist_path is not None:
            args += "--userlist-path=%s" % (userlist_path)
        cmd_str ='{0} manage.py promote_admins {1} --settings=unisubs_settings'.format(python_exe, args)
        run(cmd_str)

def promote_django_admins(email=None, new_password=None, userlist_path=None):
    """
    Make sure identified users are can access the admin site.
    If new_password is provided will reset the user's password
    You can pass either one user email, or a path to a json file with
    'email', 'new_password' objects.

    Examples:
    fab staging:serveruser promote_django_admins:email=arthur@example.com
    """
    env.host_string = env.web_hosts[0]
    return _promote_django_admins(env.web_dir, email, new_password, userlist_path)

def update_translations():
    """
    What it does:

    - Pushes new strings in english and new languages to transifex.
    - Pulls all changes from transifex, for all languages
    - Adds only the *.mo and *.po files to the index area
    - Commits to the rep with a predefined message
    - Pushes to origon.

    Caveats:

    - If any of these steps fail, it will stop execution
    - At some point, this is pretty much about syncing two reps, so conflicts can appear
    - This assumes that we do not edit translation .po files on the file system.
    - This assumes that we want to push with a "git push".
    - You must have the  .transifexrc file into your home (this has auth credentials is stored outside of source control)
    """
    run ('cd {0} && sh update_translations.sh'.format(os.path.dirname(__file__)))

def test_celeryd():
    with Output("Testing Celery scheduler"):
        env.host_string = env.celeryd_host
        output = run('ps aux | grep "%s/unisubs/manage\.py.*celeryd.*-B" | grep -v grep' % env.celeryd_proj_root)
        assert len(output.split('\n'))

def test_services():
    test_memcached()
    test_celeryd()
    with Output("Testing other services"):
        for host in env.web_hosts:
            env.host_string = host
            with cd(os.path.join(env.web_dir, 'unisubs')):
                run('{0}/env/bin/python manage.py test_services --settings=unisubs_settings'.format(
                    env.web_dir))

def test_memcached():
    with Output("Testing memcached"):
        alphanum = string.letters+string.digits
        host_set = set([(h, env.web_dir,) for h in env.web_hosts])
        if env.admin_dir:
            host_set.add((ADMIN_HOST, env.admin_dir,))
        for host in host_set:
            random_string = ''.join(
                [alphanum[random.randint(0, len(alphanum)-1)]
                for i in xrange(12)])
            env.host_string = host[0]
            with cd(os.path.join(host[1], 'unisubs')):
                run('../env/bin/python manage.py set_memcached {0} --settings=unisubs_settings'.format(
                    random_string))
            other_hosts = host_set - set([host])
            for other_host in other_hosts:
                env.host_string = other_host[0]
                output = ''
                with cd(os.path.join(other_host[1], 'unisubs')):
                    output = run('../env/bin/python manage.py get_memcached --settings=unisubs_settings')
                if output.find(random_string) == -1:
                    raise Exception('Machines {0} and {1} are using different memcached instances'.format(
                            host[0], other_host[0]))

def generate_docs():
    with Output("Generating documentation"):
        env.host_string = DEV_HOST
        with cd(os.path.join(env.static_dir, 'unisubs')):
            run('%s/env/bin/sphinx-build %s/unisubs/docs/ %s/media/docs/' % (env.static_dir, env.static_dir, env.static_dir))

try:
    from local_env import *
    def local (username):
        _create_env(**local_env_data)
except ImportError:
    pass

