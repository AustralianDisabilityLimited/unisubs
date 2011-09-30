class unisubs::closure($projectdir) {
  $current_revision = 1196
  $svn_repo = 'http://closure-library.googlecode.com/svn/trunk/'
  $local_dir = '/opt/google-closure'
  
  package { "subversion":
    ensure => "installed";
  }
  exec { "svn_checkout_closure":
    require => Package['subversion'],
    path => "/usr/local/bin:/usr/bin:/bin",
    creates => "${local_dir}/README",
    command => "svn checkout -r ${current_revision} ${svn_repo} ${local_dir}";
  }
  file { "${projectdir}/media/js/closure-library":
    require => Exec["svn_checkout_closure"],
    ensure => link,
    target => "${local_dir}";
  }
}
