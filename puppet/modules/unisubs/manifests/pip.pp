class unisubs::pip($venv, $projectdir) {
  package { 'git-core':
    ensure => 'installed';
  }
  
  python::pip::requirements { "${projectdir}/deploy/requirements.txt":
    require => Package['git-core'],
    venv => $venv,
    cwd => "${projectdir}/deploy/";
  }
}
