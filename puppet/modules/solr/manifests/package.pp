class solr::package {
  exec { "solr_download":
    path => "/usr/local/bin:/usr/bin:/bin",
    command => "wget http://mirror.metrocast.net/apache/lucene/solr/1.4.1/apache-solr-1.4.1.tgz -O /opt/solr.tgz",
    unless => "/usr/bin/test -d /opt/solr/example",
    creates => "/opt/solr.tgz";
  }
  file { "/opt/solr":
    ensure => "directory"
  }
  exec { "solr_tgz":
    path => "/usr/local/bin:/usr/bin:/bin",
    command => "tar --extract --file=solr.tgz --strip-components=1 --directory=/opt/solr",
    creates => "/opt/solr/example",
    require => [Exec["solr_download"], File["/opt/solr"]],
    cwd => "/opt";
  }
  exec { "fix_solr_owner":
    path => "/usr/local/bin:/usr/bin:/bin",
    command => "chown -R solr:solr /opt/solr/example",
    require => [Exec["solr_tgz"], User["solr"], Group["solr"]],
  }
}
