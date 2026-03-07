#!/bin/bash
set -e

# Source environment
source "$(dirname "$0")/scripts/test_env.sh"

echo ""
echo "--- 🔹 Running Server Tests 🔹 ---"
cd "$SERVER_DIR" || exit

# Use a /tmp-based directory to avoid macOS EPERM issues on quarantined project subdirs
SERVER_TMP="/tmp/racecoordinator"
SERVER_BUILD_DIR="$SERVER_TMP/target_test"
export PROTO_DEST_DIR="$SERVER_BUILD_DIR"

mkdir -p "$SERVER_TMP"
# Pre-create all directories maven needs to avoid EPERM errors
mkdir -p "$SERVER_BUILD_DIR/generated-sources/protobuf/java"
mkdir -p "$SERVER_BUILD_DIR/classes"
mkdir -p "$SERVER_BUILD_DIR/test-classes"

# 1. Generate protobufs to the /tmp-based directory
./generate_protos.sh

# 2. Run tests pointing entire build output to /tmp
mvn test \
  -Dbuild.dist.dir="$SERVER_BUILD_DIR" \
  -DskipProtobuf=true \
  -DforkCount=0 \
  -Djava.io.tmpdir="$SERVER_TMP"
