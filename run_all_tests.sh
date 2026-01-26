#!/bin/bash

# Source environment
source "$(dirname "$0")/scripts/test_env.sh"

echo "🚀 Starting all tests..."

# 1. Server Tests
./run_server_tests.sh
SERVER_EXIT_CODE=$?

# 2. Client Tests (combined unit and visual)
./run_client_tests.sh
CLIENT_EXIT_CODE=$?

# Summary
echo ""
echo "--- ✅ Global Test Summary ---"
[ $SERVER_EXIT_CODE -eq 0 ] && echo "Server Tests: PASSED" || echo "Server Tests: FAILED"
[ $CLIENT_EXIT_CODE -eq 0 ] && echo "Client Tests: PASSED" || echo "Client Tests: FAILED"

# Exit with non-zero if any suite failed
if [ $SERVER_EXIT_CODE -ne 0 ] || [ $CLIENT_EXIT_CODE -ne 0 ]; then
    exit 1
fi
