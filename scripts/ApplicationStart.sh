#!/bin/bash
##### Start Service app

cd /home/app/doorSensor/
#####      Creating a service call doorSensor
forever-service install doorSensor -r app
##### start a service called doorSensor
service doorSensor start