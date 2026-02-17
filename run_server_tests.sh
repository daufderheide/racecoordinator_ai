#!/bin/bash

# Source environment
source "$(dirname "$0")/scripts/test_env.sh"

echo ""
echo "--- 🔹 Running Server Tests 🔹 ---"
cd "$SERVER_DIR" || exit

# Use a temp dir that persists across clean and avoids spaces in path
SERVER_TMP="/tmp/racecoordinator_server_tests_$(date +%s)"
mkdir -p "$SERVER_TMP"
# Run clean to ensure fresh compilation and avoid stale classes/protos
mvn clean test -DforkCount=0 -Djava.io.tmpdir="$SERVER_TMP"
