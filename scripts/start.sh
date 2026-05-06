#!/bin/bash

# Get the root directory (parent of the scripts directory)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ROOT_DIR"

echo ""
echo "--- Race Coordinator AI Startup ---"

# Check if ports are already in use
if lsof -Pi :7070 -sTCP:LISTEN -t >/dev/null || lsof -Pi :4200 -sTCP:LISTEN -t >/dev/null ; then
    echo "Warning: Ports 7070 or 4200 are already in use."
    read -p "Would you like to run the kill script first? (y/n) " choice
    if [[ "$choice" == "y" || "$choice" == "Y" ]]; then
        echo "Running kill_client_server.sh..."
        ./kill_client_server.sh
        sleep 2
    fi
fi

# 1. Start Server
echo "[1/3] Starting Java Server in background..."
# Run in background and redirect output to a log file
./run_server.sh --headless > server.log 2>&1 &
SERVER_PID=$!

# 2. Verify Running
echo -n "[2/3] Waiting for server to be ready at http://localhost:7070..."
SERVER_READY=0
for i in {1..60}; do
    if curl -s http://localhost:7070/api/version > /dev/null; then
        SERVER_READY=1
        echo ""
        echo "Server is ready!"
        break
    fi
    echo -n "."
    sleep 2
done

if [ $SERVER_READY -eq 0 ]; then
    echo ""
    echo "Error: Server failed to start. Check server.log"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

# 3. Start Client
echo "[3/3] Starting Angular Client..."
echo "The browser will open automatically once the client is ready."
./run_client.sh
