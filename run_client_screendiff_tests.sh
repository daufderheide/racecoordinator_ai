#!/bin/bash

# Source environment
source "$(dirname "$0")/scripts/test_env.sh"

# If sync-only, run Node.js script to promote actual images to expected and exit
if [[ "$*" == *"--sync-only"* ]]; then
    echo "Syncing snapshots from last run's actual results..."
    ISOLATED_DIR="$CLIENT_DIR/.isolated-test" PW_REPORT_PATH="$CLIENT_DIR/.isolated-test/pw-result.json" CLIENT_DIR="$CLIENT_DIR" node "$(dirname "$0")/scripts/sync_snapshots.js"
    exit 0
fi

# Check if --changed or --changed=* was passed
CHANGED_FLAG=""
REMAINING_ARGS=()

for arg in "$@"; do
    if [[ "$arg" == "--changed" ]] || [[ "$arg" == --changed=* ]]; then
        CHANGED_FLAG="$arg"
    else
        REMAINING_ARGS+=("$arg")
    fi
done

if [ -n "$CHANGED_FLAG" ]; then
    echo "Resolving screendiff tests for changed files..."
    CHANGED_TESTS=$(node "$(dirname "$0")/scripts/find_changed_screendiff_tests.js" "$CHANGED_FLAG")
    if [ -z "$CHANGED_TESTS" ]; then
        echo "No changed components or screendiff tests detected from git changes."
        exit 0
    fi
    echo "Found changed screendiff tests: $CHANGED_TESTS"
    PLAYWRIGHT_ARGS="$CHANGED_TESTS ${REMAINING_ARGS[*]}"
else
    PLAYWRIGHT_ARGS="$*"
fi

export PW_REPORT_PATH="./playwright-report/pw-result.json"

echo ""
echo "--- 🔹 Running Client Visual Tests 🔹 ---"
cd "$CLIENT_DIR" || exit

# Ensure isolated directory exists and is prepared
ISOLATED_DIR="${CLIENT_DIR}/.isolated-test"
mkdir -p "$ISOLATED_DIR"

# Sync current source and configuration to isolated directory
echo "Syncing source to $ISOLATED_DIR..."
# Use rsync for faster incremental syncs (only copies changed files)
if command -v rsync &>/dev/null; then
  rsync -a --delete src/ "$ISOLATED_DIR/src/"
  rsync -a --delete scripts/ "$ISOLATED_DIR/scripts/"
  rsync -a package.json angular.json playwright.config.ts "$ISOLATED_DIR/"
  rsync -a tsconfig*.json "$ISOLATED_DIR/"
else
  cp -Rf src scripts package.json angular.json tsconfig*.json playwright.config.ts "$ISOLATED_DIR/"
fi

# Force a rebuild and clean stale test results to prevent ENOTEMPTY on Docker mounts
echo "Clearing stale build output and test results..."
rm -rf "$ISOLATED_DIR/dist" "$ISOLATED_DIR/test-results"

cd "$ISOLATED_DIR" || exit

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "Docker is required but not installed."
    echo "Attempting to install Docker via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install --cask docker
        echo -e "\n========================================================"
        echo "IMPORTANT: Docker Desktop has been installed."
        echo "You must manually open Docker Desktop from your Applications"
        echo "folder at least once to grant permissions and start the daemon."
        echo "Please do this, and then re-run this script."
        echo "========================================================\n"
        exit 1
    else
        echo "Homebrew not found. Please install Docker manually from https://www.docker.com/"
        exit 1
    fi
fi

# Make sure Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "\n\033[1;31m*****************************************************************\033[0m"
    echo -e "\033[1;31m* ERROR: Docker daemon is not running!                          *\033[0m"
    echo -e "\033[1;31m* The visual tests require Docker to ensure identical rendering.*\033[0m"
    echo -e "\033[1;31m* Please start Docker Desktop and try again.                    *\033[0m"
    echo -e "\033[1;31m*****************************************************************\033[0m\n"
    exit 1
fi

echo "Running tests in Docker container..."
mkdir -p "$ISOLATED_DIR/test-home"

# Run npm install inside container only if package.json has changed or node_modules is missing
DOCKER_CMD="node -e \"const fs=require('fs'),crypto=require('crypto');const hash=crypto.createHash('md5').update(fs.readFileSync('package.json')).digest('hex');if(!fs.existsSync('node_modules')||!fs.existsSync('.installed-hash')||fs.readFileSync('.installed-hash','utf8').trim()!==hash){console.log('Dependencies changed or missing, installing...');require('child_process').execSync('npm install --no-package-lock --ignore-scripts',{stdio:'inherit'});fs.writeFileSync('.installed-hash',hash);}\" && rm -rf /work/test-results && npx playwright test $PLAYWRIGHT_ARGS"

docker run --rm \
  --ipc=host \
  -v "$ISOLATED_DIR:/work" \
  -w /work \
  -e HOME="/work/test-home" \
  -e PWTEST_WORKERS="${PWTEST_WORKERS:-100%}" \
  mcr.microsoft.com/playwright:v1.61.1-jammy \
  /bin/bash -c "$DOCKER_CMD"
TEST_EXIT_CODE=$?

# If updating snapshots and tests succeeded, copy them back to the original source directory
if [ $TEST_EXIT_CODE -eq 0 ] && ([[ "$*" == *"--update-snapshots"* ]] || [[ "$PLAYWRIGHT_ARGS" == *"--update-snapshots"* ]]); then
    echo "Syncing updated snapshots back to source..."
    cd "$ISOLATED_DIR/src" || exit
    find . -type d -name "*-snapshots" | while read -r dir; do
        # Strip leading ./ for destination path
        dest_dir="${CLIENT_DIR}/src/${dir#./}"
        mkdir -p "$dest_dir"
        cp -Rf "$dir/" "$dest_dir/"
        echo "Copied snapshots to $dest_dir"
    done
fi

if [ $TEST_EXIT_CODE -ne 0 ]; then
    echo ""
    echo "Tests failed. Opening report..."
    cd "$CLIENT_DIR" || exit
    # Run the show-report command (this will block the terminal until you exit)
    npx playwright show-report "$ISOLATED_DIR/playwright-report"
fi

exit $TEST_EXIT_CODE
