#!/bin/bash

# Source environment
source "$(dirname "$0")/scripts/test_env.sh"

echo ""
echo "--- 🔹 Running Client Visual Tests 🔹 ---"
cd "$CLIENT_DIR" || exit

# Ensure isolated directory exists and is prepared
ISOLATED_DIR="/tmp/racecoordinator-client"
mkdir -p "$ISOLATED_DIR"

# Sync current source and configuration to isolated directory
echo "Syncing source to $ISOLATED_DIR..."
rm -rf "$ISOLATED_DIR/src"
cp -Rf src package.json angular.json tsconfig.json playwright.config.ts "$ISOLATED_DIR/"

cd "$ISOLATED_DIR" || exit

# Ensure dependencies are installed in isolated directory
if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
    echo "Installing/Updating dependencies in $ISOLATED_DIR..."
    npm install --no-package-lock --cache "$ISOLATED_DIR/npm-cache" || echo "Warning: npm install failed, trying to proceed anyway..."
fi

# Find the Chrome binary from Playwright browsers
export PLAYWRIGHT_BROWSERS_PATH="$ISOLATED_DIR/browsers"
mkdir -p "$PLAYWRIGHT_BROWSERS_PATH"

echo "Installing Playwright browsers..."
npx -y playwright install chromium

npx -y playwright test "$@"


