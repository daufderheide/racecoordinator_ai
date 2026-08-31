#!/bin/bash
set -e

RELEASE_BUILD_DIR="target_release"
DIST_DIR="release/RaceCoordinator_Linux_ARM64"
TARBALL="release/RaceCoordinatorAI-Linux-ARM64.tar.gz"

echo "Building Race Coordinator AI for Linux ARM64 (Arduino UNO Q)..."

# 0.5. Configure Version in Files if RELEASE_VERSION is specified
RELEASE_VERSION="${VERSION:-}"
if [ -z "$RELEASE_VERSION" ] && [ -f "VERSION" ]; then
    RELEASE_VERSION=$(cat VERSION | tr -d '\r\n')
fi

if [ -n "$RELEASE_VERSION" ] && [ "$RELEASE_VERSION" != "0.0.0_dev" ]; then
    echo "Configuring codebase version to $RELEASE_VERSION..."
    sed -i.bak "s/\"version\": \".*\"/\"version\": \"$RELEASE_VERSION\"/" client/package.json && rm -f client/package.json.bak
    sed -i.bak "s/SERVER_VERSION = \".*\";/SERVER_VERSION = \"$RELEASE_VERSION\";/" server/src/main/java/com/antigravity/App.java && rm -f server/src/main/java/com/antigravity/App.java.bak
    sed -i.bak "s/CLIENT_VERSION_BUILD: string = \".*\";/CLIENT_VERSION_BUILD: string = \"$RELEASE_VERSION\";/" client/src/app/version.ts && rm -f client/src/app/version.ts.bak
fi

# 1. Clean and Build Client
echo "Building Client..."
cd client
NPM_CONFIG_CACHE="$(pwd)/.npm_cache" npm install
npm run build
cd ..

# 2. Build Server
echo "Building Server (Modern - Java 11)..."
cd server
mvn clean -Dbuild.dist.dir=$RELEASE_BUILD_DIR
chmod +x generate_protos.sh
PROTO_DEST_DIR="$(pwd)/$RELEASE_BUILD_DIR" ./generate_protos.sh --server-only
mvn package -Dmaven.test.skip=true -Dbuild.dist.dir=$RELEASE_BUILD_DIR -DskipProtobuf=true
cd ..

# 3. Create Release Structure
echo "Packaging Linux ARM64 Release..."
rm -rf "$DIST_DIR" 2>/dev/null || true
mkdir -p "$DIST_DIR/web"
mkdir -p "$DIST_DIR/arduino"
mkdir -p "$DIST_DIR/scripts"
mkdir -p "$DIST_DIR/systemd"

# Copy Artifacts
cp server/$RELEASE_BUILD_DIR/server-1.0-SNAPSHOT.jar "$DIST_DIR/RaceCoordinator.jar"
cp -r client/dist/client/* "$DIST_DIR/web/"
cp -r server/src/main/resources/arduino/* "$DIST_DIR/arduino/"

# 4. Create Kiosk Launcher Script
cat << 'EOF' > "$DIST_DIR/scripts/start_kiosk.sh"
#!/bin/bash
# Wait for Race Coordinator AI backend server to start
until curl -s http://localhost:7070/api/health >/dev/null 2>&1; do
  sleep 1
done

# Launch Chromium in fullscreen kiosk mode
exec chromium-browser \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --check-for-update-interval=31536000 \
  --incognito \
  http://localhost:7070
EOF
chmod +x "$DIST_DIR/scripts/start_kiosk.sh"

# 5. Create Auto-Update Helper Script
cat << 'EOF' > "$DIST_DIR/scripts/update_app.sh"
#!/bin/bash
set -e
ARCHIVE_PATH="$1"
TARGET_DIR="/opt/racecoordinatorai"

if [ -z "$ARCHIVE_PATH" ] || [ ! -f "$ARCHIVE_PATH" ]; then
  echo "Usage: update_app.sh /path/to/RaceCoordinatorAI-Linux-ARM64.tar.gz"
  exit 1
fi

echo "Updating Race Coordinator AI..."
mkdir -p /tmp/rc_update_extract
tar -xzf "$ARCHIVE_PATH" -C /tmp/rc_update_extract/

# Copy updated files over installation
cp -r /tmp/rc_update_extract/* "$TARGET_DIR/"
rm -rf /tmp/rc_update_extract

# Flash MCU sketch if arduino-cli is installed
if command -v arduino-cli >/dev/null 2>&1; then
  echo "Flashing updated microcontroller firmware..."
  arduino-cli upload -p /dev/ttyACM0 --fqbn arduino:stm32:uno_q "$TARGET_DIR/arduino/racecoordinatorai_sketch" || true
fi

echo "Restarting service..."
systemctl restart racecoordinatorai
EOF
chmod +x "$DIST_DIR/scripts/update_app.sh"

# 6. Create Systemd Service Files
cat << 'EOF' > "$DIST_DIR/systemd/racecoordinatorai.service"
[Unit]
Description=Race Coordinator AI Standalone Daemon
After=network.target

[Service]
Type=simple
User=arduino
WorkingDirectory=/opt/racecoordinatorai
ExecStart=/usr/bin/java -Djava.awt.headless=true -Dserver.port=7070 -jar /opt/racecoordinatorai/RaceCoordinator.jar
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

cat << 'EOF' > "$DIST_DIR/systemd/racecoordinatorai-kiosk.service"
[Unit]
Description=Race Coordinator AI Local Kiosk Display
After=racecoordinatorai.service
Wants=racecoordinatorai.service

[Service]
Type=simple
User=arduino
Environment=DISPLAY=:0
ExecStart=/bin/bash /opt/racecoordinatorai/scripts/start_kiosk.sh
Restart=always
RestartSec=3

[Install]
WantedBy=graphical.target
EOF

# 7. Create Installer Script
cat << 'EOF' > "$DIST_DIR/install.sh"
#!/bin/bash
set -e

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (e.g. sudo ./install.sh)"
  exit 1
fi

INSTALL_DIR="/opt/racecoordinatorai"
echo "Installing Race Coordinator AI to $INSTALL_DIR..."

mkdir -p "$INSTALL_DIR"
cp -r ./* "$INSTALL_DIR/"

# Setup user permissions
if id "arduino" &>/dev/null; then
  chown -R arduino:arduino "$INSTALL_DIR"
fi

# Install systemd services
cp "$INSTALL_DIR/systemd/racecoordinatorai.service" /etc/systemd/system/
cp "$INSTALL_DIR/systemd/racecoordinatorai-kiosk.service" /etc/systemd/system/

systemctl daemon-reload
systemctl enable racecoordinatorai.service

echo ""
echo "Installation complete!"
echo "To start the backend service: sudo systemctl start racecoordinatorai"
echo "To enable local USB-C kiosk display: sudo systemctl enable --now racecoordinatorai-kiosk"
EOF
chmod +x "$DIST_DIR/install.sh"

# 8. Verify Release Artifacts
if [ -n "$RELEASE_VERSION" ] && [ "$RELEASE_VERSION" != "0.0.0_dev" ]; then
    echo "Verifying Linux ARM64 release artifacts..."
    node scripts/verify_release_artifacts.js "$RELEASE_VERSION" "$DIST_DIR/web" server/src/main/java/com/antigravity/App.java "" client/src/app/version.ts
fi

# 9. Create Tarball
echo "Creating release tarball $TARBALL..."
mkdir -p release
cd release
tar -czf "RaceCoordinatorAI-Linux-ARM64.tar.gz" "RaceCoordinator_Linux_ARM64"
cd ..

echo "Linux ARM64 Release build complete: $TARBALL"
