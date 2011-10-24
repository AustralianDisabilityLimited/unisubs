#!/bin/bash

set -e

sudo apt-get update
sudo apt-get install python-software-properties
sudo add-apt-repository ppa:debfx/virtualbox
sudo apt-get install dkms
sudo apt-get install "linux-headers-`uname -r`"

cd /opt
test -f 'VirtualBox-GuestAdditions-4.1.4.iso' || sudo wget 'http://download.virtualbox.org/virtualbox/4.1.4/VBoxGuestAdditions_4.1.4.iso' -O VirtualBox-GuestAdditions-4.1.4.iso

sudo mount VirtualBox-GuestAdditions-4.1.4.iso -o loop /mnt

cd /mnt

set +e
sudo sh VBoxLinuxAdditions.run --nox11
set -e

echo "-------------------------------------------------------------------------"
echo "Guest additions installed, restart the VM to finish."
echo "-------------------------------------------------------------------------"
