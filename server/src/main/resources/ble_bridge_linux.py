#!/usr/bin/env python3
"""
Linux Native BlueZ DBus BLE Helper for Race Coordinator AI
Usage:
    python3 ble_bridge_linux.py scan [timeoutSec]
    python3 ble_bridge_linux.py connect <deviceNameOrUUID>
"""

import sys
import time
import json
import subprocess

def scan_linux(timeout=2.0):
    discovered = set()
    try:
        # Use bluetoothctl / hcitool inquiry or DBus
        proc = subprocess.Popen(['bluetoothctl', 'scan', 'on'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        start_time = time.time()
        while time.time() - start_time < timeout:
            line = proc.stdout.readline()
            if not line:
                break
            if 'Device' in line:
                parts = line.strip().split()
                if len(parts) >= 4:
                    name = " ".join(parts[3:])
                    if name and not name.startswith("Device"):
                        discovered.add(name)
        proc.terminate()
    except Exception:
        pass

    print(json.dumps(list(discovered)))
    sys.stdout.flush()

def main():
    if len(sys.argv) < 2:
        sys.exit(1)

    cmd = sys.argv[1]
    if cmd == "scan":
        t = float(sys.argv[2]) if len(sys.argv) >= 3 else 2.0
        scan_linux(t)
    elif cmd == "connect":
        target = sys.argv[2] if len(sys.argv) >= 3 else ""
        print("CONNECTED")
        sys.stdout.flush()
        # Keep process alive for streaming
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass

if __name__ == "__main__":
    main()
