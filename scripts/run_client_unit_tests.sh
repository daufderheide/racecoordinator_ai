#!/bin/bash

# Source environment
source "$(dirname "$0")/test_env.sh"

echo ""
echo "--- 🔹 Running Client Unit Tests 🔹 ---"
cd "$CLIENT_DIR" || exit

# Ensure isolated directory exists and is prepared
ISOLATED_DIR="$PROJECT_ROOT/client/tmp-isolated-test-$(id -u)"
mkdir -p "$ISOLATED_DIR"

# Sync current source and configuration to isolated directory
echo "Syncing source to $ISOLATED_DIR..."
# Ensure the parent directory for server/proto exists for the relative path ../server/proto to work
mkdir -p "$(dirname "$ISOLATED_DIR")/server"
# Use rsync for faster incremental syncs (only copies changed files)
if command -v rsync &>/dev/null; then
  rsync -a --delete src/ "$ISOLATED_DIR/src/"
  rsync -a --delete "$PROJECT_ROOT/server/proto/" "$(dirname "$ISOLATED_DIR")/server/proto/"
  rsync -a karma.conf.js package.json angular.json tsconfig.json tsconfig.app.json tsconfig.spec.json package-lock.json "$ISOLATED_DIR/"
else
  rm -rf "$ISOLATED_DIR/src"
  rm -rf "$(dirname "$ISOLATED_DIR")/server/proto"
  cp -Rf src "$ISOLATED_DIR/"
  mkdir -p "$(dirname "$ISOLATED_DIR")/server"
  cp -Rf "$PROJECT_ROOT/server/proto" "$(dirname "$ISOLATED_DIR")/server/"
  cp -f karma.conf.js package.json angular.json tsconfig.json tsconfig.app.json tsconfig.spec.json package-lock.json "$ISOLATED_DIR/"
fi

# Dynamically update the Karma port to avoid conflicts/EPERM
KARMA_PORT=${KARMA_PORT:-$((9876 + $(id -u) % 100))}
sed -i '' "s/port: [0-9]*/port: $KARMA_PORT, hostname: '127.0.0.1'/" "$ISOLATED_DIR/karma.conf.js" 2>/dev/null || sed -i "s/port: [0-9]*/port: $KARMA_PORT, hostname: '127.0.0.1'/" "$ISOLATED_DIR/karma.conf.js"

cd "$ISOLATED_DIR" || exit

# Ensure dependencies are linked in isolated directory
if [ ! -e "node_modules" ]; then
    ln -s "$PROJECT_ROOT/client/node_modules" node_modules
fi

# Use a shared browsers path to avoid re-downloading
export PLAYWRIGHT_BROWSERS_PATH="/tmp/racecoordinator-browsers"
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
# Enable persistent build cache on ARM64 Mac for faster subsequent runs
if [ "$(uname -m)" = "arm64" ] && [ "$(uname -s)" = "Darwin" ]; then
  BUILD_CACHE=1
else
  BUILD_CACHE=0
fi
TMPDIR="$TMPDIR" HOME="${REAL_HOME:-$HOME}" CHROME_BIN="$CHROME_BIN" NG_PERSISTENT_BUILD_CACHE=$BUILD_CACHE ./node_modules/.bin/ng test --watch=false --browsers=ChromeHeadlessWithCustomConfig "$@"
