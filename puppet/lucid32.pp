class lucid32 {
  $projectdir = "/opt/unisubs"
  $venv = "/opt/unisubs/venv"

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
  class { 'solr': }
}

class { "lucid32": }
