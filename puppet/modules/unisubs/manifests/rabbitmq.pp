class unisubs::rabbitmq {
  rabbitmq_user { "usrmquser":
    password => "usrmqpassword",
    provider => "rabbitmqctl";
  }
  rabbitmq_vhost { "ushost":
    ensure => present,
    provider => "rabbitmqctl";
  }
  rabbitmq_user_permissions { 'usrmquser@ushost':
    configure_permission => '.*',
    read_permission => '.*',
    write_permission => '.*',
    provider => 'rabbitmqctl',
    require => [Rabbitmq_User['usrmquser'], Rabbitmq_Vhost['ushost']];
  }
}


