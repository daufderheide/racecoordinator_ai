#!/bin/bash

# Source environment
source "$(dirname "$0")/scripts/test_env.sh"

echo ""
echo "--- 🔹 Running Server Tests 🔹 ---"
cd "$SERVER_DIR" || exit
mvn test -DforkCount=0
