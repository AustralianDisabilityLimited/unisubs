class solr($solr_xml = 'UNSET') {
  if $solr_xml == 'UNSET' {
    $solr_xml_real = template("${module_name}/solr.xml")
  } else {
    $solr_xml_real = $solr_xml
  }

  class { "solr::package": }
  file { "solr.xml"
    ensure => file,
    path => "/opt/solr/example/solr/solr.xml",
    content => $solr_xml_real,
    owner => '0',
    group => '0',
    mode => '0644',
    notify => Class['solr::service'],
    require => Class['solr::package'];
  }
}
