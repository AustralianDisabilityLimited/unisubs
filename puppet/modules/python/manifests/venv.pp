define python::venv($path, $owner=undef, $group=undef) {
  Exec {
    user => $owner,
    group => $group,
    cwd => "/tmp",
  }
  
  exec { "virtualenv $path":
    creates => $path,
    path => "/usr/local/bin:/usr/bin:/bin"
  }
}
