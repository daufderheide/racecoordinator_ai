#!/bin/bash

# Source environment
source "$(dirname "$0")/scripts/test_env.sh"

echo ""
echo "--- 🔹 Running Client Visual Tests 🔹 ---"
cd "$CLIENT_DIR" || exit
PLAYWRIGHT_BROWSERS_PATH="$CLIENT_DIR/.playwright-browsers" npx playwright test "$@"
