#!/bin/bash

# Configuration
# Assuming this script is in scripts/, so PROJECT_ROOT is one level up
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CLIENT_DIR="$PROJECT_ROOT/client"
SERVER_DIR="$PROJECT_ROOT/server"

# Environment Setup for restricted environments
export TMPDIR="$PROJECT_ROOT/.browser-tmp"
export HOME="$PROJECT_ROOT/.chrome-home"
export XDG_CONFIG_HOME="$PROJECT_ROOT/.config"
export XDG_CACHE_HOME="$PROJECT_ROOT/.cache"
export PLAYWRIGHT_TRANSFORM_CACHE_PATH="$PROJECT_ROOT/.playwright-cache"
export CHROME_BIN="$CLIENT_DIR/.playwright-browsers/chromium-1208/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"

mkdir -p "$TMPDIR" "$HOME" "$XDG_CONFIG_HOME" "$XDG_CACHE_HOME" "$PLAYWRIGHT_TRANSFORM_CACHE_PATH"

# macOS Chrome requirements
mkdir -p "$HOME/Library/Application Support/Google/Chrome for Testing"

# Karma Profile Directory
export KARMA_PROFILE_DIR="$PROJECT_ROOT/.karma-profile"
rm -rf "$KARMA_PROFILE_DIR"
mkdir -p "$KARMA_PROFILE_DIR"

echo "Environment configured. Project Root: $PROJECT_ROOT"
