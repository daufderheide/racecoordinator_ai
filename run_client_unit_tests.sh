#!/bin/bash

# Source environment
source "$(dirname "$0")/scripts/test_env.sh"

echo ""
echo "--- 🔹 Running Client Unit Tests 🔹 ---"
cd "$CLIENT_DIR" || exit

# Ensure isolated directory exists and is prepared
ISOLATED_DIR="/tmp/racecoordinator-client"
mkdir -p "$ISOLATED_DIR"

# Sync current source and configuration to isolated directory
echo "Syncing source to $ISOLATED_DIR..."
# Remove existing directories to ensure clean sync and avoid attribute/permission issues when overwriting
rm -rf "$ISOLATED_DIR/src"
cp -Rf src karma.conf.js package.json angular.json tsconfig.json tsconfig.app.json tsconfig.spec.json package-lock.json "$ISOLATED_DIR/"

cd "$ISOLATED_DIR" || exit

# Ensure dependencies are installed in isolated directory
if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
    echo "Installing/Updating dependencies in $ISOLATED_DIR..."
    npm install --no-package-lock --cache "$ISOLATED_DIR/npm-cache" || echo "Warning: npm install failed, trying to proceed anyway..."
fi

# Find the Chrome binary from Playwright browsers
export PLAYWRIGHT_BROWSERS_PATH="/tmp/racecoordinator-client/browsers"
mkdir -p "$PLAYWRIGHT_BROWSERS_PATH"

# Prefer headless-shell if available as its more compatible with restricted environments
export CHROME_BIN=$(find "$PLAYWRIGHT_BROWSERS_PATH" -name "chrome-headless-shell" -type f | head -n 1)

if [ -z "$CHROME_BIN" ]; then
    # Fallback to full chrome if headless shell not found
    export CHROME_BIN=$(find "$PLAYWRIGHT_BROWSERS_PATH" -name "Google Chrome for Testing" -type f | head -n 1)
fi

if [ -z "$CHROME_BIN" ]; then
    echo "Installing Playwright browsers..."
    npx -y playwright install chromium
    export CHROME_BIN=$(find "$PLAYWRIGHT_BROWSERS_PATH" -name "chrome-headless-shell" -type f | head -n 1)
fi

echo "Using Chrome binary at: $CHROME_BIN"

# Execute tests with overridden environment
# We use ChromeHeadlessWithCustomConfig which is defined in karma.conf.js
# Explicitly use the local ng binary to avoid npx resolution issues
# Re-route Angular cache to avoid EPERM issues in the default .angular/cache directory
# Override npm cache to avoid EPERM issues in ~/.npm
TMPDIR="$TMPDIR" HOME="$HOME" CHROME_BIN="$CHROME_BIN" NG_PERSISTENT_BUILD_CACHE=0 ./node_modules/.bin/ng test --watch=false --browsers=ChromeHeadlessWithCustomConfig "$@"
