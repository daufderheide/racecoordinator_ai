#!/bin/bash
# Manually generate protobuf files to workaround maven plugin issues with spaces in paths
# Supports macOS (Intel & Apple Silicon) and Linux

set -e

# Absolute path to the server directory (where this script lives)
SERVER_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SERVER_DIR")"
PROTO_ROOT="$PROJECT_ROOT/proto"

# Detect OS and architecture
UNAME_S="$(uname -s)"
UNAME_M="$(uname -m)"

PROTOC_VERSION="3.25.1"

# Determine OS
case "$UNAME_S" in
  Darwin)
    PROTOC_OS="osx"
    ;;
  Linux)
    PROTOC_OS="linux"
    ;;
  *)
    echo "Unsupported OS for protoc: $UNAME_S"
    exit 1
    ;;
esac

# Determine architecture
case "$UNAME_M" in
  arm64|aarch64)
    PROTOC_ARCH="aarch64"
    ;;
  x86_64|amd64)
    PROTOC_ARCH="x86_64"
    ;;
  *)
    echo "Unsupported architecture for protoc: $UNAME_M"
    exit 1
    ;;
esac

# Protoc binary name (matches maven protobuf plugin layout)
PROTOC_BIN="protoc-${PROTOC_VERSION}-${PROTOC_OS}-${PROTOC_ARCH}.exe"
PROTOC="$SERVER_DIR/target_dist/protoc-plugins/$PROTOC_BIN"

# Allow overriding the destination directory
TARGET_DIR="${PROTO_DEST_DIR:-$SERVER_DIR/target_dist}"
JAVA_OUT="$TARGET_DIR/generated-sources/protobuf/java"

# Ensure output directory exists
mkdir -p "$JAVA_OUT"

# Ensure protoc exists (downloaded by maven plugin)
if [ ! -f "$PROTOC" ]; then
  echo "Protoc not found at:"
  echo "  $PROTOC"
  echo "Attempting to download via 'mvn protobuf:compile'..."
  mvn protobuf:compile > /dev/null 2>&1
fi

# Final verification
if [ ! -f "$PROTOC" ]; then
  echo "ERROR: Protoc still not found after maven download."
  exit 1
fi

echo "Generating protobuf files using:"
echo "  $PROTOC"

"$PROTOC" \
  --proto_path="$PROTO_ROOT" \
  --java_out="$JAVA_OUT" \
  "$PROTO_ROOT"/client/*.proto \
  "$PROTO_ROOT"/server/*.proto \
  "$PROTO_ROOT"/message.proto

echo "Protobuf compilation successful."