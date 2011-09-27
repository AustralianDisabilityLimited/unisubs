Vagrant::Config.run do |config|
  config.vm.host_name = "unisubs"
  config.vm.box = "lucid32"
  config.vm.box_url = "http://files.vagrantup.com/lucid32.box"

  config.vm.forward_port "http", 80, 8000
  config.vm.forward_port "solr", 8983, 8983

  config.vm.share_folder "unisubs", "/opt/unisubs", "."

  config.vm.provision :puppet do |puppet|
    puppet.manifests_path = "puppet"
    puppet.module_path = "puppet/modules"
    puppet.manifest_file = "lucid32.pp"
    puppet.options = "--verbose"
  end
end
