#!/bin/bash
# Manually generate protobuf files to workaround maven plugin issues with spaces in paths
# Supports macOS (Intel & Apple Silicon) and Linux

set -e

# Absolute path to the server directory (where this script lives)
SERVER_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SERVER_DIR")"
PROTO_ROOT="$SERVER_DIR/proto"

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
M2_REPO="${REAL_HOME:-$HOME}/.m2/repository"
PROTOC_M2="$M2_REPO/com/google/protobuf/protoc/${PROTOC_VERSION}/${PROTOC_BIN}"

# Allow overriding the destination directory
TARGET_DIR="${PROTO_DEST_DIR:-$SERVER_DIR/target_dist}"
JAVA_OUT="$TARGET_DIR/generated-sources/protobuf/java"

# Ensure output directory exists
mkdir -p "$JAVA_OUT"

# Priority: 1. protoc_local.exe in server dir, 2. PROTOC_M2
if [ -f "$SERVER_DIR/protoc_local.exe" ]; then
  echo "Using local protoc found in server directory."
  PROTOC_LOCAL="$SERVER_DIR/protoc_local.exe"
else
  # Ensure protoc exists in local maven repository (downloaded by maven plugin)
  if [ ! -f "$PROTOC_M2" ]; then
    echo "Protoc not found at:"
    echo "  $PROTOC_M2"
    echo "Attempting to download via 'mvn protobuf:compile'..."
    mvn protobuf:compile > /dev/null 2>&1
  fi

  # Final verification
  if [ ! -f "$PROTOC_M2" ]; then
    echo "ERROR: Protoc still not found after maven download."
    exit 1
  fi

  PROTOC_LOCAL="$TARGET_DIR/protoc-plugins/$PROTOC_BIN"
  mkdir -p "$(dirname "$PROTOC_LOCAL")"

  # Only copy if needed
  if [ ! -f "$PROTOC_LOCAL" ] || [ "$PROTOC_M2" -nt "$PROTOC_LOCAL" ]; then
    cp "$PROTOC_M2" "$PROTOC_LOCAL"
    chmod +x "$PROTOC_LOCAL"
  fi
fi

echo "Generating protobuf files using:"
echo "  $PROTOC_LOCAL"

# Use find with null terminator to safely handle spaces in paths
PROTO_FILES=()
while IFS=  read -r -d $'\0'; do
    PROTO_FILES+=("$REPLY")
done < <(find "$PROTO_ROOT" -name "*.proto" -print0)

if [ ${#PROTO_FILES[@]} -eq 0 ]; then
    echo "ERROR: No .proto files found in $PROTO_ROOT"
    exit 1
fi

"$PROTOC_LOCAL" \
  --proto_path="$PROTO_ROOT" \
  --java_out="$JAVA_OUT" \
  "${PROTO_FILES[@]}"

echo "Protobuf compilation successful."

# Generate Client-side Protos (JavaScript/TypeScript)
if [ -d "$PROJECT_ROOT/client" ]; then
    echo "Generating client-side protobuf files..."
    CLIENT_PROTO_OUT="$PROJECT_ROOT/client/src/app/proto"
    mkdir -p "$CLIENT_PROTO_OUT"
    pushd "$PROTO_ROOT" > /dev/null
    npx -y -p protobufjs-cli pbjs -p . -t static-module -w es6 -o "$CLIENT_PROTO_OUT/message.js" client/*.proto server/*.proto message.proto
    npx -y -p protobufjs-cli pbts -o "$CLIENT_PROTO_OUT/message.d.ts" "$CLIENT_PROTO_OUT/message.js"
    popd > /dev/null
    echo "Client-side protobuf generation successful."
fi