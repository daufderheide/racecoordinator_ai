#!/bin/bash
set -e

# Source environment
source "$(dirname "$0")/scripts/test_env.sh"

echo ""
echo "--- 🔹 Running Server Mutation Tests (PITest) 🔹 ---"
cd "$SERVER_DIR" || exit

SERVER_TMP="$(pwd)/target_tmp"
SERVER_BUILD_DIR="$SERVER_TMP/target_test"
export PROTO_DEST_DIR="$SERVER_BUILD_DIR"

mkdir -p "$SERVER_TMP"
mkdir -p "$SERVER_BUILD_DIR/generated-sources/protobuf/java"
mkdir -p "$SERVER_BUILD_DIR/classes"
mkdir -p "$SERVER_BUILD_DIR/test-classes"

./generate_protos.sh --server-only

TARGET_CLASSES=""
TARGET_TESTS=""
MUTATION_THRESHOLD="0"
EXTRA_MVN_ARGS=()

# Parse arguments
for arg in "$@"; do
  case $arg in
    --target=*)
      TARGET="${arg#*=}"
      TARGET_CLASSES="$TARGET"
      TARGET_TESTS="${TARGET}Test"
      ;;
    --target-classes=*)
      TARGET_CLASSES="${arg#*=}"
      ;;
    --target-tests=*)
      TARGET_TESTS="${arg#*=}"
      ;;
    --threshold=*)
      MUTATION_THRESHOLD="${arg#*=}"
      ;;
    *)
      EXTRA_MVN_ARGS+=("$arg")
      ;;
  esac
done

PITEST_ARGS=""

if [ -n "$TARGET_CLASSES" ]; then
  PITEST_ARGS="$PITEST_ARGS -DtargetClasses=$TARGET_CLASSES"
fi

if [ -n "$TARGET_TESTS" ]; then
  PITEST_ARGS="$PITEST_ARGS -DtargetTests=$TARGET_TESTS"
fi

if [ "$MUTATION_THRESHOLD" != "0" ]; then
  PITEST_ARGS="$PITEST_ARGS -DmutationThreshold=$MUTATION_THRESHOLD"
fi

mvn test-compile org.pitest:pitest-maven:mutationCoverage \
  -Dbuild.dist.dir="$SERVER_BUILD_DIR" \
  -DskipProtobuf=true \
  -Djava.io.tmpdir="$SERVER_TMP" \
  -Dmaven.repo.local="$SERVER_DIR/.m2/repository" \
  $PITEST_ARGS "${EXTRA_MVN_ARGS[@]}"

REPORT_DIR=$(find "$SERVER_BUILD_DIR/pit-reports" -maxdepth 1 -mindepth 1 -type d | sort -r | head -n 1)
if [ -n "$REPORT_DIR" ] && [ -f "$REPORT_DIR/index.html" ]; then
  echo ""
  echo "✅ Mutation Report Generated: $REPORT_DIR/index.html"
fi
