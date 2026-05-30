#!/bin/bash
cd "$(dirname "$0")/../client" || exit 1

if [ ! -d "node_modules" ]; then
    echo "First time setup: Installing dependencies..."
    npm install
fi

npm run proto:gen
npm start
