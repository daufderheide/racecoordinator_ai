#!/bin/bash
# Find and kill mongod processes on ports 8085 and 27017

echo "Checking for processes on ports 8085 (embedded) and 27017 (default)..."

for Port in 8085 27017; do
  PID=$(lsof -ti :$Port)
  if [ ! -z "$PID" ]; then
    echo "Found process(es) $PID on port $Port."
    echo "Killing process..."
    kill -9 $PID 2>/dev/null || true
    echo "Process killed."
  fi
done
