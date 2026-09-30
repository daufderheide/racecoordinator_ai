#!/bin/bash
set -e

RELEASE_BUILD_DIR="target_release"
DIST_DIR="release/RaceCoordinator_Linux_ARM64"
TARBALL="release/RaceCoordinatorAI-Linux-ARM64.tar.gz"

echo "Building Race Coordinator AI for Linux ARM64 (Arduino UNO Q)..."

# 0. Check for from-artifacts flag
FROM_ARTIFACTS=false
for arg in "$@"; do
    if [ "$arg" == "--from-artifacts" ]; then
        FROM_ARTIFACTS=true
    fi
done

# 0.5. Configure Version in Files if RELEASE_VERSION is specified
RELEASE_VERSION="${VERSION:-}"
if [ -z "$RELEASE_VERSION" ] && [ -f "VERSION" ]; then
    RELEASE_VERSION=$(cat VERSION | tr -d '\r\n')
fi

if [ "$FROM_ARTIFACTS" = "true" ]; then
    echo "Using pre-built release artifacts from release/RaceCoordinator..."
    if [ ! -f "release/RaceCoordinator/RaceCoordinator.jar" ]; then
        echo "ERROR: release/RaceCoordinator/RaceCoordinator.jar not found!"
        exit 1
    fi
    if [ ! -d "release/RaceCoordinator/web" ]; then
        echo "ERROR: release/RaceCoordinator/web directory not found!"
        exit 1
    fi
else
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
fi

# 3. Create Release Structure
echo "Packaging Linux ARM64 Release..."
rm -rf "$DIST_DIR" 2>/dev/null || true
mkdir -p "$DIST_DIR/web"
mkdir -p "$DIST_DIR/arduino"
mkdir -p "$DIST_DIR/scripts"
mkdir -p "$DIST_DIR/systemd"

# Copy Artifacts
if [ "$FROM_ARTIFACTS" = "true" ]; then
    cp release/RaceCoordinator/RaceCoordinator.jar "$DIST_DIR/RaceCoordinator.jar"
    cp -r release/RaceCoordinator/web/* "$DIST_DIR/web/"
    if [ -d "release/RaceCoordinator/arduino" ]; then
        cp -r release/RaceCoordinator/arduino/* "$DIST_DIR/arduino/"
    elif [ -d "server/src/main/resources/arduino" ]; then
        cp -r server/src/main/resources/arduino/* "$DIST_DIR/arduino/"
    fi
else
    cp server/$RELEASE_BUILD_DIR/server-1.0-SNAPSHOT.jar "$DIST_DIR/RaceCoordinator.jar"
    cp -r client/dist/client/* "$DIST_DIR/web/"
    cp -r server/src/main/resources/arduino/* "$DIST_DIR/arduino/"
fi

# 4. Create Kiosk Launcher Script
cat << 'EOF' > "$DIST_DIR/scripts/start_kiosk.sh"
#!/bin/bash
# Wait for Race Coordinator AI backend server to start
until curl -s http://localhost:7070 >/dev/null 2>&1; do
  sleep 1
done

# Launch Chromium in fullscreen kiosk mode
BROWSER_BIN=$(command -v chromium || command -v chromium-browser || echo "chromium")
"$BROWSER_BIN" \
  --kiosk \
  --noerrdialogs \
  --disable-infobars \
  --check-for-update-interval=31536000 \
  --incognito \
  http://localhost:7070 &
BROWSER_PID=$!

# Ensure Race Coordinator AI gains and retains window focus over desktop autostart apps (such as Arduino App Lab)
for i in {1..12}; do
  sleep 2
  if command -v wmctrl >/dev/null 2>&1; then
    wmctrl -a "Race Coordinator" 2>/dev/null || wmctrl -a "Chromium" 2>/dev/null || true
  fi
done

wait "$BROWSER_PID"
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
  BOARD_INFO=$(arduino-cli board list 2>/dev/null | grep -i "uno.*q" | head -n1)
  PORT=$(echo "$BOARD_INFO" | awk '{print $1}')
  FQBN=$(echo "$BOARD_INFO" | awk '{print $6}')
  [ -z "$PORT" ] && PORT="172.17.0.1"
  [ -z "$FQBN" ] && FQBN="arduino:zephyr:unoq"
  arduino-cli upload -p "$PORT" --fqbn "$FQBN" --upload-field password=arduino "$TARGET_DIR/arduino/racecoordinatorai_sketch" 2>/dev/null || \
    arduino-cli upload -p "$PORT" --fqbn "$FQBN" "$TARGET_DIR/arduino/racecoordinatorai_sketch" || true
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
After=racecoordinatorai.service graphical.target
Wants=racecoordinatorai.service

[Service]
Type=simple
User=arduino
Environment=DISPLAY=:0
Environment=XAUTHORITY=/home/arduino/.Xauthority
ExecStart=/bin/bash /opt/racecoordinatorai/scripts/start_kiosk.sh
Restart=always
RestartSec=3

[Install]
WantedBy=graphical.target
EOF

# 7. Create Automated & Manual Installer Scripts
cat << 'EOF' > "$DIST_DIR/install.sh"
#!/bin/bash
set -e

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (e.g. sudo ./install.sh)"
  exit 1
fi

INSTALL_DIR="/opt/racecoordinatorai"
echo "=========================================================="
echo " Starting Race Coordinator AI Automated Installer"
echo " Target Directory: $INSTALL_DIR"
echo "=========================================================="

# 1. System prerequisites check and auto-installation
REQUIRED_PKGS=(default-jre-headless chromium wmctrl espeak-ng alsa-utils git curl unzip)
MISSING_PKGS=()
for pkg in "${REQUIRED_PKGS[@]}"; do
  if ! dpkg -s "$pkg" >/dev/null 2>&1; then
    MISSING_PKGS+=("$pkg")
  fi
done

if [ ${#MISSING_PKGS[@]} -gt 0 ]; then
  echo "Installing missing system prerequisites: ${MISSING_PKGS[*]}..."
  apt-get update -qq
  DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "${MISSING_PKGS[@]}"
else
  echo "All system prerequisites are already installed."
fi

# Ensure arduino-cli is installed
if ! command -v arduino-cli >/dev/null 2>&1; then
  echo "Installing arduino-cli..."
  curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | BINDIR=/usr/local/bin sh || true
fi

# 2. File deployment
mkdir -p "$INSTALL_DIR"
CURRENT_DIR="$(pwd -P)"
TARGET_DIR="$(cd "$INSTALL_DIR" 2>/dev/null && pwd -P || echo "$INSTALL_DIR")"
if [ "$CURRENT_DIR" != "$TARGET_DIR" ]; then
  echo "Copying application files to $INSTALL_DIR..."
  cp -r ./* "$INSTALL_DIR/"
fi

# 3. User permissions & serial access
if id "arduino" &>/dev/null; then
  chown -R arduino:arduino "$INSTALL_DIR"
  usermod -a -G dialout arduino 2>/dev/null || true
fi

# 4. Systemd service registration and boot auto-start
echo "Registering systemd services..."
cp "$INSTALL_DIR/systemd/racecoordinatorai.service" /etc/systemd/system/
cp "$INSTALL_DIR/systemd/racecoordinatorai-kiosk.service" /etc/systemd/system/

systemctl daemon-reload
systemctl enable racecoordinatorai.service
systemctl enable racecoordinatorai-kiosk.service

# 5. Microcontroller firmware compile and upload
if command -v arduino-cli >/dev/null 2>&1; then
  echo "Checking microcontroller core, libraries, and firmware..."
  if ! arduino-cli core list 2>/dev/null | grep -q "arduino:zephyr"; then
    echo "Installing Zephyr board core..."
    arduino-cli core update-index >/dev/null 2>&1 || true
    arduino-cli core install arduino:zephyr >/dev/null 2>&1 || arduino-cli core install arduino:stm32 >/dev/null 2>&1 || true
  fi

  echo "Installing required Arduino libraries (Arduino_RouterBridge, FastLED)..."
  arduino-cli lib update-index >/dev/null 2>&1 || true
  arduino-cli lib install Arduino_RouterBridge >/dev/null 2>&1 || true
  arduino-cli lib install FastLED >/dev/null 2>&1 || true

  BOARD_INFO=$(arduino-cli board list 2>/dev/null | grep -i "uno.*q" | head -n1)
  PORT=$(echo "$BOARD_INFO" | awk '{print $1}')
  FQBN=$(echo "$BOARD_INFO" | awk '{print $6}')
  [ -z "$FQBN" ] && FQBN="arduino:zephyr:unoq"
  [ -z "$PORT" ] && PORT="172.17.0.1"

  if [ -d "$INSTALL_DIR/arduino/racecoordinatorai_sketch" ]; then
    echo "Compiling and uploading sketch to $FQBN on $PORT..."
    if ! arduino-cli compile --fqbn "$FQBN" "$INSTALL_DIR/arduino/racecoordinatorai_sketch"; then
      echo "Notice: Sketch compilation encountered a warning/error. Continuing installation..."
    elif ! (arduino-cli upload -p "$PORT" --fqbn "$FQBN" --upload-field password=arduino "$INSTALL_DIR/arduino/racecoordinatorai_sketch" 2>/dev/null || \
            arduino-cli upload -p "$PORT" --fqbn "$FQBN" "$INSTALL_DIR/arduino/racecoordinatorai_sketch"); then
      echo "Notice: MCU upload to $PORT was busy or not ready. Continuing installation..."
    else
      echo "Firmware upload successful!"
    fi
  fi
fi

# 6. Service startup
echo "Starting Race Coordinator AI services..."
systemctl restart racecoordinatorai.service
systemctl restart racecoordinatorai-kiosk.service

IP_ADDR=$(hostname -I 2>/dev/null | awk '{print $1}')
HOST_NAME=$(hostname 2>/dev/null || echo "localhost")
echo ""
echo "=========================================================="
echo " Race Coordinator AI Installation Complete!"
echo " - Kiosk Display: ACTIVE on TV screen"
echo " - Web UI:        http://${HOST_NAME}:7070 or http://${IP_ADDR}:7070"
echo " - Boot Launch:   AUTO-START ENABLED on power-on"
echo "=========================================================="
EOF
chmod +x "$DIST_DIR/install.sh"

cat << 'EOF' > "$DIST_DIR/manual_install.sh"
#!/bin/bash
set -e

if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (e.g. sudo ./manual_install.sh)"
  exit 1
fi

INSTALL_DIR="/opt/racecoordinatorai"
echo "Copying Race Coordinator AI files to $INSTALL_DIR..."
mkdir -p "$INSTALL_DIR"
CURRENT_DIR="$(pwd -P)"
TARGET_DIR="$(cd "$INSTALL_DIR" 2>/dev/null && pwd -P || echo "$INSTALL_DIR")"
if [ "$CURRENT_DIR" != "$TARGET_DIR" ]; then
  cp -r ./* "$INSTALL_DIR/"
fi

if id "arduino" &>/dev/null; then
  chown -R arduino:arduino "$INSTALL_DIR"
  usermod -a -G dialout arduino 2>/dev/null || true
fi

cp "$INSTALL_DIR/systemd/racecoordinatorai.service" /etc/systemd/system/
cp "$INSTALL_DIR/systemd/racecoordinatorai-kiosk.service" /etc/systemd/system/

systemctl daemon-reload
systemctl enable racecoordinatorai.service
systemctl enable racecoordinatorai-kiosk.service

echo ""
echo "Manual installation complete!"
echo "To start services: sudo systemctl start racecoordinatorai && sudo systemctl start racecoordinatorai-kiosk"
EOF
chmod +x "$DIST_DIR/manual_install.sh"

# 8. Verify Release Artifacts
if [ -n "$RELEASE_VERSION" ] && [ "$RELEASE_VERSION" != "0.0.0_dev" ]; then
    echo "Verifying Linux ARM64 release artifacts..."
    if [ "$FROM_ARTIFACTS" = "true" ]; then
        node scripts/verify_release_artifacts.js "$RELEASE_VERSION" "$DIST_DIR/web" "" "" ""
    else
        node scripts/verify_release_artifacts.js "$RELEASE_VERSION" "$DIST_DIR/web" server/src/main/java/com/antigravity/App.java "" client/src/app/version.ts
    fi
fi

# 9. Create Tarball
echo "Creating release tarball $TARBALL..."
mkdir -p release
cd release
tar -czf "RaceCoordinatorAI-Linux-ARM64.tar.gz" "RaceCoordinator_Linux_ARM64"
cd ..

echo "Linux ARM64 Release build complete: $TARBALL"
