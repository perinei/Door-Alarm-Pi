#!/bin/bash
echo "install modules"
sudo apt-get update -y
sudo apt-get upgrade -y
cd /opt/M220/
npm install
echo "module installed"