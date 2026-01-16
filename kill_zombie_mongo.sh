#!/bin/bash
# Find mongod processes running with the project's data directory
# We search for 'mongod' and the specific data directory to avoid killing other mongo instances

# Get absolute path of the current directory to match against full paths in ps aux
PROJECT_DIR="$(pwd)"
DATA_DIR_SUFFIX="server/mongodb_data"

echo "Searching for zombie MongoDB processes for data dir suffix: $DATA_DIR_SUFFIX"

# Find PIDs
# 1. List all processes
# 2. Filter for 'mongod'
# 3. Filter for our specific data directory
# 4. Filter out the grep command itself
# 5. Extract just the PID (2nd column)
PIDS=$(ps aux | grep "mongod" | grep "$DATA_DIR_SUFFIX" | grep -v grep | awk '{print $2}')

if [ -z "$PIDS" ]; then
  echo "No zombie MongoDB processes found."
else
  echo "Found zombie MongoDB processes: $PIDS"
  echo "Killing processes..."
  echo "$PIDS" | xargs kill -9
  echo "Done. Processes killed."
fi
