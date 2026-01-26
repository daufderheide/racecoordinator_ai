#!/bin/bash

# Configuration
PROJECT_ROOT=$(pwd)
CLIENT_DIR="$PROJECT_ROOT/client"
SERVER_DIR="$PROJECT_ROOT/server"

# Environment Setup for restricted environments
export TMPDIR="$PROJECT_ROOT/.browser-tmp"
export HOME="$PROJECT_ROOT/.chrome-home"
export XDG_CONFIG_HOME="$PROJECT_ROOT/.config"
export XDG_CACHE_HOME="$PROJECT_ROOT/.cache"
export PLAYWRIGHT_TRANSFORM_CACHE_PATH="$PROJECT_ROOT/.playwright-cache"
export CHROME_BIN="$CLIENT_DIR/.playwright-browsers/chromium-1208/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"
mkdir -p "$TMPDIR" "$HOME" "$XDG_CONFIG_HOME" "$XDG_CACHE_HOME" "$PLAYWRIGHT_TRANSFORM_CACHE_PATH"
# soddisfare i requisiti di macOS per Chrome
mkdir -p "$HOME/Library/Application Support/Google/Chrome for Testing"
# Usa un percorso MOLTO CORTO in /tmp per i socket Unix (max 104 char)
export KARMA_PROFILE_DIR="$PROJECT_ROOT/.karma-profile"
rm -rf "$KARMA_PROFILE_DIR"
mkdir -p "$KARMA_PROFILE_DIR"

echo "🚀 Starting all tests..."

# 1. Server Tests (Java/Maven)
echo ""
echo "--- 🔹 Running Server Tests 🔹 ---"
cd "$SERVER_DIR" || exit
mvn test -DforkCount=0
SERVER_EXIT_CODE=$?

# 2. Client Unit Tests (Angular/Jasmine)
echo ""
echo "--- 🔹 Running Client Unit Tests 🔹 ---"
cd "$CLIENT_DIR" || exit
# Ensure dependencies are installed (using local cache to avoid permission issues)
npm install --no-package-lock --cache "$PROJECT_ROOT/.npm-cache"
npx ng test --watch=false --browsers=ChromeHeadlessWithCustomConfig
CLIENT_UNIT_EXIT_CODE=$?

# 3. Client Visual Tests (Playwright)
echo ""
echo "--- 🔹 Running Client Visual Tests 🔹 ---"
cd "$CLIENT_DIR" || exit
PLAYWRIGHT_BROWSERS_PATH="$CLIENT_DIR/.playwright-browsers" npx playwright test
CLIENT_VISUAL_EXIT_CODE=$?

# Summary
echo ""
echo "--- ✅ Test Summary ---"
[ $SERVER_EXIT_CODE -eq 0 ] && echo "Server Tests: PASSED" || echo "Server Tests: FAILED"
[ $CLIENT_UNIT_EXIT_CODE -eq 0 ] && echo "Client Unit Tests: PASSED" || echo "Client Unit Tests: FAILED"
[ $CLIENT_VISUAL_EXIT_CODE -eq 0 ] && echo "Client Visual Tests: PASSED" || echo "Client Visual Tests: FAILED"

# Exit with non-zero if any suite failed
if [ $SERVER_EXIT_CODE -ne 0 ] || [ $CLIENT_UNIT_EXIT_CODE -ne 0 ] || [ $CLIENT_VISUAL_EXIT_CODE -ne 0 ]; then
    exit 1
fi
