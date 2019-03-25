#!/bin/bash
echo "Starting Server"
sudo forever-service install door
sudo service door start
echo "Server is running"
