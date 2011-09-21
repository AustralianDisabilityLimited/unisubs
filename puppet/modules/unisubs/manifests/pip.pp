class unisubs::pip($venv, $projectdir, $owner=undef, $group=undef) {
  package { 'git-core':
    ensure => 'installed';
  }
  
  python::pip::requirements { "${projectdir}/deploy/requirements.txt":
    require => Package['git-core'],
    venv => $venv,
    cwd => "${projectdir}/deploy/",
    owner => $owner,
    group => $group;
  }
}
