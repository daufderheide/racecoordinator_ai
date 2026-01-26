#!/bin/bash

# Source environment
source "$(dirname "$0")/scripts/test_env.sh"

echo ""
echo "--- 🔹 Running Client Unit Tests 🔹 ---"
cd "$CLIENT_DIR" || exit
# Ensure dependencies are installed (using local cache to avoid permission issues)
npm install --no-package-lock --cache "$PROJECT_ROOT/.npm-cache"
npx ng test --watch=false --browsers=ChromeHeadlessWithCustomConfig
