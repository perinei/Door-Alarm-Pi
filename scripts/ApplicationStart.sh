#!/bin/bash
##### Start Service app

cd /home/app/doorSensor/
#####      Creating a service call doorSensor
sudo forever-service install doorSensor -r app
##### start a service called doorSensor
sudo service doorSensor start