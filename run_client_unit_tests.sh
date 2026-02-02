#!/bin/bash

# Source environment
source "$(dirname "$0")/scripts/test_env.sh"

echo ""
echo "--- 🔹 Running Client Unit Tests 🔹 ---"
cd "$CLIENT_DIR" || exit
# Ensure dependencies are installed (using local cache to avoid permission issues)
npm install --no-package-lock --cache "$PROJECT_ROOT/.npm-cache"

# --- Browser Setup for Headless Testing ---
# We use Playwright's bundled Chromium to ensure a consistent environment without needing system Chrome.
export PLAYWRIGHT_BROWSERS_PATH="./.playwright-browsers"

# Install Chromium if missing (checks for the directory)
if [ ! -d "$PLAYWRIGHT_BROWSERS_PATH" ]; then
    echo "Installing Playwright browsers (Chromium) for headless testing..."
    npx playwright install chromium
fi

# Locate the Chrome binary dynamically used by Playwright
# It's usually nested deep in the artifacts folder.
CHROME_PATH=$(find "$PLAYWRIGHT_BROWSERS_PATH" -name "Google Chrome for Testing" -type f | head -n 1)

if [ -z "$CHROME_PATH" ]; then
    echo "Error: Could not locate Playwright Chromium binary. Trying to install again..."
    npx playwright install chromium
    CHROME_PATH=$(find "$PLAYWRIGHT_BROWSERS_PATH" -name "Google Chrome for Testing" -type f | head -n 1)
fi

if [ -n "$CHROME_PATH" ]; then
    export CHROME_BIN="$CHROME_PATH"
    echo "Using Chrome binary at: $CHROME_BIN"
else
    echo "Warning: Could not automatically find Playwright Chrome. Falling back to system configuration."
    # Fallback to standard system chrome logic if needed, or let Karma fail/try its default.
fi

npx ng test --watch=false --browsers=ChromeHeadlessWithCustomConfig
