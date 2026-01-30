#!/bin/bash

# Source environment
source "$(dirname "$0")/scripts/test_env.sh"

echo ""
echo "--- 🔹 Running Server Tests 🔹 ---"
cd "$SERVER_DIR" || exit
mkdir -p target_dist/tmp
mvn test -DforkCount=0 -Djava.io.tmpdir="$(pwd)/target_dist/tmp"
