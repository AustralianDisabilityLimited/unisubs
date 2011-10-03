class lucid32 {
  $projectdir = "/opt/unisubs"
  $venv = "/opt/unisubs/venv"

  group { "vagrant": ensure => "present"; } ->
  user { "vagrant": ensure => "present"; } ->
  class { 'environ': }

  group { "puppet": ensure => "present"; }  ->
  class { 'aptitude': } ->
  class { 'java': } ->
  class { 'python': } ->
  python::venv { "unisubsvenv":
    path => $venv,
    owner => "vagrant",
    group => "vagrant"; } ->
  class { 'unisubs::pip':
    venv => $venv,
    projectdir => $projectdir,
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
}

class { "lucid32": }
