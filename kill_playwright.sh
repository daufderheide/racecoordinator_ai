#!/bin/bash

echo "Searching for Playwright processes..."

# Find processes matching 'playwright' or test browser instances, excluding the current script's PID
pids=$(pgrep -f "playwright|Google Chrome for Testing|chromium-1228|antigravity-browser-profile" | grep -v $$)

if [ -z "$pids" ]; then
    echo "No Playwright or test browser processes found."
else
    # Replace newlines with spaces for a cleaner output string
    pid_list=$(echo $pids | tr '\n' ' ')
    echo "Killing Playwright and test browser processes: $pid_list"
    
    # Kill the processes
    echo "$pids" | xargs kill -9 2>/dev/null
    echo "Done."
fi
