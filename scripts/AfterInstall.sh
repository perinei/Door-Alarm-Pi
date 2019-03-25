#!/bin/bash
#echo "install modules"
#sudo apt-get update -y
#sudo apt-get upgrade -y
#cd /opt/M220/
#npm install

echo "module installed"

echo "getteing Parameters store variables"
sns_arn=$(aws ssm get-parameters --region us-east-1 --names sns_arn --query Parameters[0].Value)
cd /opt/office/
rm env.js
echo module.exports.sns_arn = $sns_arn >> env.js
echo "Parameters stores saved to env.js"
