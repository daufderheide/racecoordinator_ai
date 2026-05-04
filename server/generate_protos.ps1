#!/usr/bin/env pwsh
# Manually generate protobuf files to workaround maven plugin issues with spaces in paths
# Windows PowerShell version

$ErrorActionPreference = "Stop"

# Absolute path to the server directory (where this script lives)
$SERVER_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $SERVER_DIR
$PROTO_ROOT = Join-Path $SERVER_DIR "proto"

$PROTOC_VERSION = "3.25.1"

# Protoc binary name (matches maven protobuf plugin layout for Windows)
$PROTOC_BIN = "protoc-${PROTOC_VERSION}-windows-x86_64.exe"
$M2_REPO = Join-Path $env:USERPROFILE ".m2\repository"
$PROTOC_M2 = Join-Path $M2_REPO "com\google\protobuf\protoc\${PROTOC_VERSION}\${PROTOC_BIN}"

# Allow overriding the destination directory
$TARGET_DIR = if ($env:PROTO_DEST_DIR) { $env:PROTO_DEST_DIR } else { Join-Path $SERVER_DIR "target_dist" }
$JAVA_OUT = Join-Path $TARGET_DIR "generated-sources\protobuf\java"

# Ensure output directory exists
if (-not (Test-Path $JAVA_OUT)) {
    New-Item -ItemType Directory -Path $JAVA_OUT -Force | Out-Null
}

# Priority: 1. protoc.exe in server dir, 2. PROTOC_M2, 3. system protoc
$PROTOC_LOCAL = $null
$LOCAL_PROTOC = Join-Path $SERVER_DIR "protoc.exe"

if (Test-Path $LOCAL_PROTOC) {
    Write-Host "Using local protoc found in server directory."
    $PROTOC_LOCAL = $LOCAL_PROTOC
} else {
    # Ensure protoc exists in local maven repository (downloaded by maven plugin)
    if (-not (Test-Path $PROTOC_M2)) {
        Write-Host "Protoc not found at:"
        Write-Host "  $PROTOC_M2"
        Write-Host "Attempting to download via 'mvn protobuf:compile'..."
        # Run maven to download protoc
        Set-Location $SERVER_DIR
        mvn protobuf:compile 2>&1 | Out-Null
    }

    if (Test-Path $PROTOC_M2) {
        # Copy to target dir for consistency
        $PROTOC_LOCAL_DIR = Join-Path $TARGET_DIR "protoc-plugins"
        if (-not (Test-Path $PROTOC_LOCAL_DIR)) {
            New-Item -ItemType Directory -Path $PROTOC_LOCAL_DIR -Force | Out-Null
        }
        $PROTOC_LOCAL = Join-Path $PROTOC_LOCAL_DIR $PROTOC_BIN
        
        # Only copy if needed
        if ((-not (Test-Path $PROTOC_LOCAL)) -or ((Get-Item $PROTOC_M2).LastWriteTime -gt (Get-Item $PROTOC_LOCAL).LastWriteTime)) {
            Copy-Item $PROTOC_M2 $PROTOC_LOCAL -Force
        }
    } elseif (Get-Command protoc -ErrorAction SilentlyContinue) {
        # Fallback to system protoc
        $PROTOC_LOCAL = (Get-Command protoc).Source
        Write-Host "Using system protoc ($PROTOC_LOCAL). WARNING: Version mismatch possible."
    } else {
        throw "ERROR: Protoc not found after maven download."
    }
}

Write-Host "Generating protobuf files using:"
Write-Host "  $PROTOC_LOCAL"

# Find all .proto files
$PROTO_FILES = Get-ChildItem -Path $PROTO_ROOT -Recurse -Filter "*.proto" | Select-Object -ExpandProperty FullName

if ($PROTO_FILES.Count -eq 0) {
    throw "ERROR: No .proto files found in $PROTO_ROOT"
}

# Generate Java protobuf files
& $PROTOC_LOCAL --proto_path="$PROTO_ROOT" --java_out="$JAVA_OUT" $PROTO_FILES

Write-Host "Protobuf compilation successful."

# Check for --server-only flag
$ServerOnly = $args -contains "--server-only"

# Generate Client-side Protos (JavaScript/TypeScript)
$CLIENT_DIR = Join-Path $PROJECT_ROOT "client"
if ((-not $ServerOnly) -and (Test-Path $CLIENT_DIR)) {
    Write-Host "Generating client-side protobuf files..."
    $CLIENT_PROTO_OUT = Join-Path $CLIENT_DIR "src\app\proto"
    if (-not (Test-Path $CLIENT_PROTO_OUT)) {
        New-Item -ItemType Directory -Path $CLIENT_PROTO_OUT -Force | Out-Null
    }
    
    # Use glob patterns like the shell script does - run from PROTO_ROOT so imports resolve correctly
    Set-Location $PROTO_ROOT
    npx -y -p protobufjs-cli pbjs -p . -t static-module -w es6 -o "$CLIENT_PROTO_OUT\message.js" client/*.proto server/*.proto message.proto
    npx -y -p protobufjs-cli pbts -o "$CLIENT_PROTO_OUT\message.d.ts" "$CLIENT_PROTO_OUT\message.js"
    Write-Host "Client-side protobuf generation successful."
}
