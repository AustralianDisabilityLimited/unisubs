class solr($solr_xml = 'UNSET', $solr_init = 'UNSET') {
  if $solr_xml == 'UNSET' {
    $solr_xml_real = template("${module_name}/solr.xml.erb")
  } else {
    $solr_xml_real = $solr_xml
  }
  if $solr_init == 'UNSET' {
    $solr_init_real = template("${module_name}/solr.erb")
  } else {
    $solr_init_real = $solr_init
  }
  class { "solr::package": }
  file { "solr.xml":
    ensure => file,
    path => "/opt/solr/example/solr/solr.xml",
    content => $solr_xml_real,
    owner => '0',
    group => '0',
    mode => '0644',
    notify => Service['solr'],
    require => Class['solr::package'];
  }
  group { "solr":
    ensure => "present";
  }
  user { "solr":
    ensure => "present",
    comment => "Runs solr daemon",
    shell => "/bin/bash",
    gid => "solr",
    require => Group['solr'];
  }
  file { "/etc/init.d/solr":
    require => [File['solr.xml'], User['solr']],
    ensure => file,
    content => $solr_init_real,
    owner => '0',
    group => '0',
    mode => '0755';
  }
  service { "solr":
    require => File["/etc/init.d/solr"],
    ensure => "running",
    hasrestart => true,
    hasstatus => false;
  }
}
