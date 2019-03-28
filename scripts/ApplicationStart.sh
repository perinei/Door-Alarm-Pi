#!/bin/bash
echo "Starting Server"
cd /opt/doorSensor/
echo "Creating a service call doorSensor"
sudo forever-service install doorSensor -r perinei
echo "start a service called doorSensor"
sudo service doorSensor start
echo "Server is running!"