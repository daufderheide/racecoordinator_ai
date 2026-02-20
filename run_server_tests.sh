#!/bin/bash

# Source environment
source "$(dirname "$0")/scripts/test_env.sh"

echo ""
echo "--- 🔹 Running Server Tests 🔹 ---"
cd "$SERVER_DIR" || exit

# Use a specific directory for tests to avoid conflicts with running server or IDE builds
# This also helps isolate from target_dist which seems to have locking issues on macOS
export PROTO_DEST_DIR="$(pwd)/target_test"

# Use a temp dir that avoids spaces in path and ensures write permissions
SERVER_TMP="/tmp/racecoordinator"
mkdir -p "$SERVER_TMP"

# 1. Clean the test directory
mvn clean -Dbuild.dist.dir="$PROTO_DEST_DIR"

# 2. Manually generate protos to workaround space-in-path issues
# generate_protos.sh uses PROTO_DEST_DIR
./generate_protos.sh

# 3. Run tests using target_test
# We don't run clean again here to keep the manually generated protos
mvn test -Dbuild.dist.dir="$PROTO_DEST_DIR" -DforkCount=0 -Djava.io.tmpdir="$SERVER_TMP"
