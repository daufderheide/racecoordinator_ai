#!/bin/bash
cd "$(dirname "$0")/client"

if [ ! -d "node_modules" ]; then
    echo "First time setup: Installing dependencies..."
    npm install
fi

npm start
