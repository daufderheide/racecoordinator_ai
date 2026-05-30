#!/bin/bash
set -e

# Source environment
source "$(dirname "$0")/test_env.sh"

echo ""
echo "--- 🔹 Running Server Tests 🔹 ---"
cd "$SERVER_DIR" || exit

# Use a local directory to avoid macOS EPERM issues on quarantined project subdirs or /tmp issues
SERVER_TMP="$(pwd)/target_tmp"
SERVER_BUILD_DIR="$SERVER_TMP/target_test"
export PROTO_DEST_DIR="$SERVER_BUILD_DIR"
export npm_config_cache="$SERVER_TMP/npm_cache"
export EMBEDDED_MONGO_ARTIFACTS="$SERVER_TMP/.embedmongo"

mkdir -p "$SERVER_TMP"
# Pre-create all directories maven needs to avoid EPERM errors
mkdir -p "$SERVER_BUILD_DIR/generated-sources/protobuf/java"
mkdir -p "$SERVER_BUILD_DIR/classes"
mkdir -p "$SERVER_BUILD_DIR/test-classes"

# 1. Generate protobufs to the /tmp-based directory
./generate_protos.sh --server-only

# 2. Run tests pointing entire build output to /tmp
# Detect Apple Silicon for parallel test optimization
if [ "$(uname -m)" = "arm64" ] && [ "$(uname -s)" = "Darwin" ]; then
  # 0.5C is much more reasonable for an 18-core M5 than 4C.
  FORK_COUNT="0.5C"
  REUSE_FORKS="true"
  MVN_THREADS="-T 0.5C"
else
  FORK_COUNT="1"
  REUSE_FORKS="true"
  MVN_THREADS=""
fi

# JVM optimization for faster startup in tests
JVM_OPTS="-XX:TieredStopAtLevel=1 -Djdk.attach.allowAttachSelf=true --add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.lang.reflect=ALL-UNNAMED --add-opens java.base/java.io=ALL-UNNAMED --add-opens java.base/java.util=ALL-UNNAMED"

mvn test $MVN_THREADS "$@" \
  -Dbuild.dist.dir="$SERVER_BUILD_DIR" \
  -DskipProtobuf=true \
  -DforkCount="$FORK_COUNT" \
  -DreuseForks="$REUSE_FORKS" \
  -Djava.io.tmpdir="$SERVER_TMP" \
  -Dde.flapdoodle.embed.mongo.artifacts="$SERVER_TMP/.embedmongo" \
  -Dmaven.repo.local="$SERVER_DIR/.m2/repository"
