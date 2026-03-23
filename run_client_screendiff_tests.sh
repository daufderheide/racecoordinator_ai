#!/bin/bash

# Source environment
source "$(dirname "$0")/scripts/test_env.sh"

# If sync-only, run Node.js script to promote actual images to expected and exit
if [[ "$*" == *"--sync-only"* ]]; then
    echo "Syncing snapshots from last run's actual results..."
    CLIENT_DIR="$CLIENT_DIR" node "$(dirname "$0")/scripts/sync_snapshots.js"
    exit 0
fi

echo ""
echo "--- 🔹 Running Client Visual Tests 🔹 ---"
cd "$CLIENT_DIR" || exit

# Ensure isolated directory exists and is prepared
ISOLATED_DIR="/private/tmp/racecoordinator-client"
mkdir -p "$ISOLATED_DIR"

# Sync current source and configuration to isolated directory
echo "Syncing source to $ISOLATED_DIR..."
rm -rf "$ISOLATED_DIR/src"
cp -Rf src package.json angular.json tsconfig*.json playwright.config.ts "$ISOLATED_DIR/"

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

# If updating snapshots, copy them back to the original source directory
if [[ "$*" == *"--update-snapshots"* ]]; then
    echo "Syncing updated snapshots back to source..."
    cd "$ISOLATED_DIR/src" || exit
    find . -type d -name "*-snapshots" | while read -r dir; do
        # Strip leading ./ for destination path
        dest_dir="${CLIENT_DIR}/src/${dir#./}"
        mkdir -p "$dest_dir"
        cp -Rf "$dir/" "$dest_dir/"
        echo "Copied snapshots to $dest_dir"
    done
fi


