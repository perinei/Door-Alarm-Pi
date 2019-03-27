#!/bin/bash

#sudo apt-get update -y
#sudo apt-get upgrade -y

echo "installing modules"
cd /opt/doorSensor/
npm install
echo "module installed"

echo "getteing Parameters store variables"
sns_arn=$(aws ssm get-parameters --region us-east-1 --names sns_arn --query Parameters[0].Value)
cd /opt/doorSensor/
echo "deleting old env.js"
rm env.js
#creating new env.js with sns_arn
sudo echo module.exports.sns_arn = $sns_arn >> /opt/doorSensor/env.js
echo "Parameters stores saved to env.js"
