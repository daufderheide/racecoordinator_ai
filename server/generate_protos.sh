#!/bin/bash
# Manually generate protobuf files to workaround maven plugin issues with spaces in paths

# Configuration
# Path to the server directory (where this script lives)
SERVER_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROTO_SRC_DIR="$SERVER_DIR/../proto"
# Use a local directory to bypass permission issues with target_dist
GEN_SRC_DIR="$SERVER_DIR/generated-sources/protobuf/java"

echo "Using PROTO_SRC_DIR: $PROTO_SRC_DIR"
echo "Using GEN_SRC_DIR: $GEN_SRC_DIR"

# Ensure output directory exists and is clean
if [ -d "$GEN_SRC_DIR" ]; then
    echo "Cleaning existing generated sources..."
    rm -rf "$GEN_SRC_DIR"/*
else
    mkdir -p "$GEN_SRC_DIR"
fi

# Find protoc (check hardcoded path from maven plugin first)
MAVEN_PROTOC="$HOME/.m2/repository/com/google/protobuf/protoc/3.25.1/protoc-3.25.1-osx-x86_64.exe"
# Try to find it in target_dist as well
PLUGIN_PROTOC="$SERVER_DIR/target_dist/protoc-plugins/protoc-3.25.1-osx-x86_64.exe"
# Local writable copy
PROTOC_EXE="$SERVER_DIR/protoc_local.exe"

if [ ! -f "$PROTOC_EXE" ]; then
    if [ -f "$MAVEN_PROTOC" ]; then
        echo "Copying protoc from maven repository: $MAVEN_PROTOC"
        cp "$MAVEN_PROTOC" "$PROTOC_EXE"
        chmod +x "$PROTOC_EXE"
    elif [ -f "$PLUGIN_PROTOC" ]; then
        echo "Copying protoc from plugin directory: $PLUGIN_PROTOC"
        cp "$PLUGIN_PROTOC" "$PROTOC_EXE"
        chmod +x "$PROTOC_EXE"
    else
        echo "Protoc executable not found. Please ensure it is installed or run mvn protobuf:compile manually."
        # Don't try to run mvn here as it's known to fail in this environment
        # exit 1 
    fi
fi

if [ -f "$PROTOC_EXE" ]; then
    echo "Generating protobuf files using $PROTOC_EXE..."
    # Generate each proto file, searching recursively
    find "$PROTO_SRC_DIR" -name "*.proto" | while read proto_file; do
        echo "Processing $proto_file..."
        "$PROTOC_EXE" --proto_path="$PROTO_SRC_DIR" --java_out="$GEN_SRC_DIR" "$proto_file"
        if [ $? -ne 0 ]; then
            echo "Error generating $proto_file"
            exit 1
        fi
    done
    echo "Protobuf generation successful."
else
    # Fallback to system protoc
    if command -v protoc >/dev/null 2>&1; then
        echo "Using system protoc..."
        find "$PROTO_SRC_DIR" -name "*.proto" | while read proto_file; do
            echo "Processing $proto_file..."
            protoc --proto_path="$PROTO_SRC_DIR" --java_out="$GEN_SRC_DIR" "$proto_file"
            if [ $? -ne 0 ]; then
                echo "Error generating $proto_file"
                exit 1
            fi
        done
        echo "Protobuf generation successful (via system protoc)."
    else
        echo "Error: protoc not found. Please ensure it is installed or run mvn protobuf:compile manually."
        exit 1
    fi
fi
