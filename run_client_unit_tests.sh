#!/bin/bash

# Source environment
source "$(dirname "$0")/scripts/test_env.sh"

echo ""
echo "--- 🔹 Running Client Unit Tests 🔹 ---"
cd "$CLIENT_DIR" || exit

# Ensure dependencies are installed (using isolated cache)
if [ ! -d "node_modules" ]; then
    npm install --no-package-lock --cache "/tmp/racecoordinator-client/npm-cache" || echo "Warning: npm install failed, trying to proceed anyway..."
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
TMPDIR="$TMPDIR" HOME="$HOME" CHROME_BIN="$CHROME_BIN" npx ng test --watch=false --browsers=ChromeHeadlessWithCustomConfig "$@"
