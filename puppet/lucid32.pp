class lucid32 {
  $projectdir = "/opt/unisubs"
  $venv = "/opt/unisubs-env"

  group { "puppet": ensure => "present"; }  ->
  class { 'aptitude': } ->
  class { 'java': } ->
  class { 'python': } ->
  python::venv { "unisubsvenv": path => $venv } ->
  class { 'unisubs::pip': venv => $venv, projectdir => $projectdir } ->
  class { 'unisubs::db': }
}

class { "lucid32": }
