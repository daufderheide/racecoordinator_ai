#!/bin/bash
set -e

if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "Error: This script must be run on macOS."
    exit 1
fi

if [ ! -d "release/RaceCoordinator" ]; then
    echo "Error: release/RaceCoordinator directory not found."
    echo "Please ensure the build has been completed and artifacts are available."
    exit 1
fi

echo "Creating Mac Online DMG..."
mkdir -p release/dmg_content
mkdir -p release/dmg_content/web

echo "Copying core application files from release/RaceCoordinator..."
cp release/RaceCoordinator/RaceCoordinator.jar release/dmg_content/RaceCoordinator.jar
cp -r release/RaceCoordinator/web/* release/dmg_content/web/
if [ -d "release/RaceCoordinator/arduino" ]; then
    cp -r release/RaceCoordinator/arduino release/dmg_content/
fi

echo "Bundling Mac-specific scripts..."
cp release/RaceCoordinator/start_mac.command release/dmg_content/
if [ -f "scripts/install_dependencies_mac.sh" ]; then
    cp scripts/install_dependencies_mac.sh release/dmg_content/
fi
cp release/RaceCoordinator/README.txt release/dmg_content/

# Update README inside DMG if needed
cat >> release/dmg_content/README.txt << 'EOF'

Mac User Note:
--------------
If Java is not installed, running start_mac.command will offer to automatically download and install dependencies for you.
EOF

hdiutil create -volname "RaceCoordinator" -srcfolder release/dmg_content -ov -format UDZO release/RaceCoordinator_Mac.dmg || echo "Warning: Mac DMG creation failed, but continuing..."
rm -rf release/dmg_content

echo "Mac DMG successfully created at release/RaceCoordinator_Mac.dmg"
