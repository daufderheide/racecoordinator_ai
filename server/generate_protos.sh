#!/bin/bash
# Manually generate protobuf files to workaround maven plugin issues with spaces in paths

# Absolute path to the server directory (where this script lives)
SERVER_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SERVER_DIR")"
PROTO_ROOT="$PROJECT_ROOT/proto"

# Protoc executable path (downloaded by maven plugin)
PROTOC="$SERVER_DIR/target_dist/protoc-plugins/protoc-3.25.1-osx-x86_64.exe"
# Allow overriding the destination directory via PROTO_DEST_DIR environment variable
TARGET_DIR="${PROTO_DEST_DIR:-$SERVER_DIR/target_dist}"
JAVA_OUT="$TARGET_DIR/generated-sources/protobuf/java"

# Ensure target directory exists (mvn clean might have removed it)
mkdir -p "$JAVA_OUT"

# Verify protoc exists
if [ ! -f "$PROTOC" ]; then
    echo "Protoc executable not found at $PROTOC"
    echo "Running 'mvn protobuf:compile' once to download it..."
    mvn protobuf:compile > /dev/null 2>&1
fi

echo "Generating protobuf files..."
"$PROTOC" --proto_path="$PROTO_ROOT" --java_out="$JAVA_OUT" \
    "$PROTO_ROOT"/client/*.proto \
    "$PROTO_ROOT"/server/*.proto \
    "$PROTO_ROOT"/message.proto

if [ $? -eq 0 ]; then
    echo "Protobuf compilation successful."
else
    echo "Protobuf compilation FAILED."
    exit 1
fi
