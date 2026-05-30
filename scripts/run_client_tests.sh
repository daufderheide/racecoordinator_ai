#!/bin/bash

# Source environment
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test_env.sh"

# Run Unit Tests
"$SCRIPT_DIR/run_client_unit_tests.sh"
UNIT_EXIT_CODE=$?

# Run Visual Tests
"$SCRIPT_DIR/run_client_screendiff_tests.sh"
VISUAL_EXIT_CODE=$?

# Summary
echo ""
echo "--- ✅ Client Test Summary ---"
[ $UNIT_EXIT_CODE -eq 0 ] && echo "Client Unit Tests: PASSED" || echo "Client Unit Tests: FAILED"
[ $VISUAL_EXIT_CODE -eq 0 ] && echo "Client Visual Tests: PASSED" || echo "Client Visual Tests: FAILED"

if [ $UNIT_EXIT_CODE -ne 0 ] || [ $VISUAL_EXIT_CODE -ne 0 ]; then
    exit 1
fi
