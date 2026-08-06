#!/bin/bash
cd "$(dirname "$0")/client"

if [ ! -d "node_modules" ] || [ package.json -nt node_modules ] || [ package-lock.json -nt node_modules ]; then
    echo "Installing/updating dependencies..."
    npm install
    touch node_modules
fi

npm run proto:gen
if [ "$1" = "--open" ]; then
    exec npx ng serve --host 0.0.0.0 --open
else
    exec npx ng serve --host 0.0.0.0
fi
