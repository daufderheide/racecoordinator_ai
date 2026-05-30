#!/bin/bash
# Find and kill mongod processes on port 27017
# Using lsof as ps seems to have permission issues on some macs

echo "Checking for processes on port 27017..."

# Get PID using lsof
PID=$(lsof -ti :27017)

if [ -z "$PID" ]; then
  echo "No process found on port 27017."
else
  echo "Found process $PID on port 27017."
  echo "Killing process..."
  kill -9 $PID
  echo "Process killed."
fi
