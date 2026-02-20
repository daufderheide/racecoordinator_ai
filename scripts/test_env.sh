#!/bin/bash

# Configuration
# Assuming this script is in scripts/, so PROJECT_ROOT is one level up
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CLIENT_DIR="$PROJECT_ROOT/client"
SERVER_DIR="$PROJECT_ROOT/server"

# Environment Setup for restricted environments
BASE_TMP="/tmp/racecoordinator-client"
mkdir -p "$BASE_TMP"

export TMPDIR="$BASE_TMP/browser-tmp"
export HOME="$BASE_TMP/chrome-home"
export XDG_CONFIG_HOME="$BASE_TMP/config"
export XDG_CACHE_HOME="$BASE_TMP/cache"
export PLAYWRIGHT_TRANSFORM_CACHE_PATH="$BASE_TMP/playwright-cache"
# export CHROME_BIN is handled by run_client_unit_tests.sh

mkdir -p "$TMPDIR" "$HOME" "$XDG_CONFIG_HOME" "$XDG_CACHE_HOME" "$PLAYWRIGHT_TRANSFORM_CACHE_PATH"

# macOS Chrome requirements
mkdir -p "$HOME/Library/Application Support/Google/Chrome for Testing"

# Karma Profile Directory
export KARMA_PROFILE_DIR="$BASE_TMP/karma-profile"
rm -rf "$KARMA_PROFILE_DIR"
mkdir -p "$KARMA_PROFILE_DIR"

echo "Environment configured. Project Root: $PROJECT_ROOT"
