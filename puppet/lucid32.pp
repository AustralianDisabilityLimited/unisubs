class lucid32 {
  $projectdir = "/opt/unisubs"
  $extrasdir = "/opt/extras"
  $venv = "/opt/extras/venv"

  group { "vagrant": ensure => "present"; } ->
  user { "vagrant": ensure => "present"; } ->
  class { 'environ': } ->
  file { "${extrasdir}":
    ensure => directory,
    owner => "vagrant",
    group => "vagrant",
  }

  group { "puppet": ensure => "present"; }  ->
  class { 'aptitude': } ->
  class { 'java': } ->
  class { 'python': } ->
  python::venv { "unisubsvenv":
    require => [File["${extrasdir}"]],
    path => $venv,
    owner => "vagrant",
    group => "vagrant"; } ->
  class { 'unisubs::db': } ->
  class { 'solr': 
    require => Package["curl"],
  } ->
  class { "rabbitmq::server": } ->
  class { "unisubs::rabbitmq": } ->
  class { "celeryd":
    project_dir => "$projectdir/",
    settings_module => "dev_settings",
    venv => $venv;
  }

  class { 'unisubs::closure':
    projectdir => $projectdir
  }
  class { 'nginx': }

  package { "curl": ensure => "present", }
  package { "git-core": ensure => "installed", }
  package { "swig": ensure => "installed", }
}

class { "lucid32": }
