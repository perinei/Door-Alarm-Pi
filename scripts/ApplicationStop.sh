#!/bin/bash
echo "Stoping app!"
#sudo service doorSensor stop
sudo forever-service delete doorSensor
echo "app stopped"
