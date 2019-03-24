#!/bin/bash
echo "Starting Server"
cd /opt/M220/
forever start index.js
echo "Listening to port 5000"