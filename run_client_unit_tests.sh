#!/bin/bash

# Source environment
source "$(dirname "$0")/scripts/test_env.sh"

echo ""
echo "--- 🔹 Running Client Unit Tests 🔹 ---"
cd "$CLIENT_DIR" || exit
# Ensure dependencies are installed (using local cache to avoid permission issues)
npm install --no-package-lock --cache "$PROJECT_ROOT/.npm-cache"

# Find the Chrome binary from Playwright browsers
export PLAYWRIGHT_BROWSERS_PATH="./.playwright-browsers"
# Prefer headless-shell if available as its more compatible with restricted environments
export CHROME_BIN=$(find "$PLAYWRIGHT_BROWSERS_PATH" -name "chrome-headless-shell" -type f | head -n 1)

if [ -z "$CHROME_BIN" ]; then
    # Fallback to full chrome if headless shell not found
    export CHROME_BIN=$(find "$PLAYWRIGHT_BROWSERS_PATH" -name "Google Chrome for Testing" -type f | head -n 1)
fi

if [ -z "$CHROME_BIN" ]; then
    echo "Installing Playwright browsers..."
    npx playwright install chromium
    export CHROME_BIN=$(find "$PLAYWRIGHT_BROWSERS_PATH" -name "chrome-headless-shell" -type f | head -n 1)
fi

echo "Using Chrome binary at: $CHROME_BIN"

# Execute tests with overridden environment
# We use ChromeHeadlessWithCustomConfig which is defined in karma.conf.js
TMPDIR="$TMPDIR" HOME="$HOME" CHROME_BIN="$CHROME_BIN" npx ng test --watch=false --browsers=ChromeHeadlessWithCustomConfig "$@"
