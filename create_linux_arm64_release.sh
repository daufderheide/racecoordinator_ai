#!/bin/bash
set -e

RELEASE_BUILD_DIR="target_release"
DIST_DIR="release/RaceCoordinator_Linux_ARM64"
TARBALL="release/RaceCoordinatorAI-Linux-ARM64.tar.gz"

echo "Building Race Coordinator AI for Linux ARM64 (Raspberry Pi & Arduino UNO Q)..."

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
    if [ -d "help_center/site" ]; then
        mkdir -p "$DIST_DIR/web/help"
        cp -r help_center/site/* "$DIST_DIR/web/help/"
    fi
    cp -r server/src/main/resources/arduino/* "$DIST_DIR/arduino/"
fi

# 4. Create Kiosk Launcher Script
cat << 'EOF' > "$DIST_DIR/scripts/start_kiosk.sh"
#!/bin/bash
# Wait for Race Coordinator AI backend server to start
until curl -s http://localhost:7070 >/dev/null 2>&1; do
  sleep 1
done

# Ensure user runtime directory and D-Bus session are configured for audio and Speech Dispatcher
if [ -z "$XDG_RUNTIME_DIR" ]; then
  CURRENT_UID=$(id -u)
  export XDG_RUNTIME_DIR="/run/user/$CURRENT_UID"
fi
if [ -z "$DBUS_SESSION_BUS_ADDRESS" ] && [ -e "$XDG_RUNTIME_DIR/bus" ]; then
  export DBUS_SESSION_BUS_ADDRESS="unix:path=$XDG_RUNTIME_DIR/bus"
fi

# Ensure Speech Dispatcher socket is running for text-to-speech in Chromium
if command -v systemctl >/dev/null 2>&1; then
  systemctl --user start speech-dispatcher.socket 2>/dev/null || true
fi

# Launch Chromium in maximized window mode with Speech Dispatcher, unprompted autoplay, and multi-tab support
BROWSER_BIN=$(command -v chromium || command -v chromium-browser || echo "chromium")
"$BROWSER_BIN" \
  --start-maximized \
  --test-type \
  --enable-speech-dispatcher \
  --autoplay-policy=no-user-gesture-required \
  --no-first-run \
  --noerrdialogs \
  --disable-infobars \
  --check-for-update-interval=31536000 \
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

# Check prerequisites if running as root
if [ "$EUID" -eq 0 ]; then
  REQUIRED_PKGS=(default-jre-headless chromium wmctrl espeak-ng speech-dispatcher speech-dispatcher-espeak-ng alsa-utils git curl unzip)
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
  fi
  # Detect service user from directory ownership or fallback
  APP_USER=""
  if [ -d "$TARGET_DIR" ]; then
    APP_USER=$(stat -c '%U' "$TARGET_DIR" 2>/dev/null || ls -ld "$TARGET_DIR" | awk '{print $3}')
  fi
  if [ -z "$APP_USER" ] || [ "$APP_USER" = "root" ]; then
    if id "arduino" &>/dev/null; then
      APP_USER="arduino"
    elif id "pi" &>/dev/null; then
      APP_USER="pi"
    fi
  fi
  if [ -n "$APP_USER" ] && [ "$APP_USER" != "root" ] && id "$APP_USER" &>/dev/null; then
    usermod -a -G dialout,audio "$APP_USER" 2>/dev/null || true
    if command -v loginctl >/dev/null 2>&1; then
      loginctl enable-linger "$APP_USER" 2>/dev/null || true
    fi
    if command -v systemctl >/dev/null 2>&1; then
      systemctl -M "$APP_USER@" --user enable --now speech-dispatcher.socket 2>/dev/null || \
      su - "$APP_USER" -c "systemctl --user enable --now speech-dispatcher.socket" 2>/dev/null || true
    fi
  fi
fi

echo "Updating Race Coordinator AI..."
mkdir -p /tmp/rc_update_extract
tar -xzf "$ARCHIVE_PATH" -C /tmp/rc_update_extract/

# Copy updated files over installation (handling root directory in archive if present)
if [ -d "/tmp/rc_update_extract/RaceCoordinator_Linux_ARM64" ]; then
  cp -rf --remove-destination /tmp/rc_update_extract/RaceCoordinator_Linux_ARM64/* "$TARGET_DIR/"
else
  cp -rf --remove-destination /tmp/rc_update_extract/* "$TARGET_DIR/"
fi
chmod +x "$TARGET_DIR/scripts/"*.sh "$TARGET_DIR/"*.sh 2>/dev/null || true
rm -rf /tmp/rc_update_extract
rm -rf "$TARGET_DIR/RaceCoordinator_Linux_ARM64"

# Update systemd kiosk service if present
if [ -d "/etc/systemd/system" ] && [ -n "$APP_USER" ] && [ "$APP_USER" != "root" ]; then
  APP_UID=$(id -u "$APP_USER" 2>/dev/null || echo "1000")
  APP_HOME=$(eval echo "~$APP_USER")
  sed -i "s|^User=.*|User=$APP_USER|" "$TARGET_DIR/systemd/racecoordinatorai-kiosk.service" 2>/dev/null || true
  sed -i "s|XAUTHORITY=.*|XAUTHORITY=$APP_HOME/.Xauthority|" "$TARGET_DIR/systemd/racecoordinatorai-kiosk.service" 2>/dev/null || true
  sed -i "s|/run/user/1000|/run/user/$APP_UID|g" "$TARGET_DIR/systemd/racecoordinatorai-kiosk.service" 2>/dev/null || true
  (cp "$TARGET_DIR/systemd/racecoordinatorai-kiosk.service" /etc/systemd/system/ && systemctl daemon-reload) 2>/dev/null || true
fi

# Stop services early so frontend detects update progress immediately
echo "Stopping services for firmware compilation and update installation..."
(sudo systemctl stop racecoordinatorai-kiosk racecoordinatorai || systemctl stop racecoordinatorai-kiosk racecoordinatorai) 2>/dev/null || true

# Detect if running on an Arduino Uno Q
IS_UNO_Q=false
if [ -f /proc/device-tree/model ]; then
  DT_MODEL=$(tr -d '\0' < /proc/device-tree/model 2>/dev/null || cat /proc/device-tree/model 2>/dev/null || true)
  if echo "$DT_MODEL" | grep -qiE "uno.*q|QRB2210|Dragonwing"; then
    IS_UNO_Q=true
  fi
elif [ -f /sys/firmware/devicetree/base/model ]; then
  SYS_MODEL=$(tr -d '\0' < /sys/firmware/devicetree/base/model 2>/dev/null || cat /sys/firmware/devicetree/base/model 2>/dev/null || true)
  if echo "$SYS_MODEL" | grep -qiE "uno.*q|QRB2210|Dragonwing"; then
    IS_UNO_Q=true
  fi
fi
if [ "$IS_UNO_Q" = "false" ] && command -v arduino-cli >/dev/null 2>&1; then
  if arduino-cli board list 2>/dev/null | grep -qi "uno.*q"; then
    IS_UNO_Q=true
  fi
fi

# Flash MCU sketch only if running on an Arduino Uno Q
if [ "$IS_UNO_Q" = "true" ] && command -v arduino-cli >/dev/null 2>&1; then
  echo "Arduino Uno Q detected: Checking microcontroller core and compiling firmware..."
  if ! arduino-cli core list 2>/dev/null | grep -q "arduino:zephyr"; then
    echo ""
    echo "=========================================================================="
    echo " Installing Zephyr board core (arduino:zephyr)..."
    echo " - This downloads ~500MB+ and installs the RTOS & ARM compiler toolchain."
    echo " - Estimated Time: 5 to 10+ minutes depending on network & eMMC flash speed."
    echo " - Time to grab a coffee! Live progress is displayed below."
    echo "=========================================================================="
    echo ""
    arduino-cli core update-index || true
    arduino-cli core install arduino:zephyr || true
  fi

  BOARD_INFO=$(arduino-cli board list 2>/dev/null | grep -i "uno.*q" | head -n1)
  PORT=$(echo "$BOARD_INFO" | awk '{print $1}')
  FQBN=$(echo "$BOARD_INFO" | grep -o 'arduino:[a-zA-Z0-9_:]*' | head -n1)
  if [ -z "$FQBN" ] || [ "$FQBN" = "arduino:stm32" ] || [ "$FQBN" = "Q" ]; then
    FQBN="arduino:zephyr:unoq"
  fi
  if [ -z "$PORT" ]; then
    PORT="172.17.0.1"
  fi

  if [ -d "$TARGET_DIR/arduino/racecoordinatorai_sketch" ]; then
    echo "Compiling and uploading sketch to $FQBN on $PORT..."
    if arduino-cli compile --fqbn "$FQBN" "$TARGET_DIR/arduino/racecoordinatorai_sketch"; then
      arduino-cli upload -p "$PORT" --fqbn "$FQBN" --upload-field password=arduino "$TARGET_DIR/arduino/racecoordinatorai_sketch" 2>/dev/null || \
      arduino-cli upload -p "$PORT" --fqbn "$FQBN" "$TARGET_DIR/arduino/racecoordinatorai_sketch" || true
    fi
  fi
else
  echo "Skipping onboard MCU firmware flash (not an Arduino Uno Q or sketch upload not required)."
fi

echo "Starting updated services..."
(sleep 1 && (sudo systemctl start racecoordinatorai || systemctl start racecoordinatorai) && (sudo systemctl start racecoordinatorai-kiosk || systemctl start racecoordinatorai-kiosk || true)) >/dev/null 2>&1 &
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
ExecStart=/usr/bin/java -Djava.awt.headless=true -Dserver.port=7070 -jar /opt/racecoordinatorai/RaceCoordinator.jar --headless --daemon
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
Environment=XDG_RUNTIME_DIR=/run/user/1000
Environment=DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
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

VERBOSE_FLAG=""
CLI_BOARD=""
CLI_USER=""
SKIP_SKETCH=false

while [ $# -gt 0 ]; do
  case "$1" in
    -v|--verbose)
      VERBOSE_FLAG="-v"
      shift
      ;;
    --board=*)
      CLI_BOARD="${1#*=}"
      shift
      ;;
    --board)
      CLI_BOARD="$2"
      shift 2
      ;;
    --pi|--raspberry-pi|--rpi)
      CLI_BOARD="pi"
      shift
      ;;
    --unoq|--uno-q|--arduino)
      CLI_BOARD="unoq"
      shift
      ;;
    --user=*)
      CLI_USER="${1#*=}"
      shift
      ;;
    --user)
      CLI_USER="$2"
      shift 2
      ;;
    --skip-sketch|--skip-mcu)
      SKIP_SKETCH=true
      shift
      ;;
    -h|--help)
      echo "Usage: sudo ./install.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --board=<pi|unoq|generic>  Specify board type (auto-detected by default)"
      echo "  --user=<username>          Service user account (auto-detected by default)"
      echo "  --skip-sketch, --skip-mcu  Skip compiling and uploading Arduino MCU sketch"
      echo "  -v, --verbose              Enable verbose logging"
      echo "  -h, --help                 Display this help message"
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

# 0. Board Determination & Auto-Detection
BOARD_TYPE=""
BOARD_REASON=""
if [ -n "$CLI_BOARD" ]; then
  case "$(echo "$CLI_BOARD" | tr '[:upper:]' '[:lower:]')" in
    pi|raspberry*|rpi)
      BOARD_TYPE="pi"
      BOARD_REASON="Manually specified via CLI (--board=$CLI_BOARD)"
      ;;
    uno*|arduino)
      BOARD_TYPE="unoq"
      BOARD_REASON="Manually specified via CLI (--board=$CLI_BOARD)"
      ;;
    generic|pc|other)
      BOARD_TYPE="generic"
      BOARD_REASON="Manually specified via CLI (--board=$CLI_BOARD)"
      ;;
    *)
      echo "Unknown board override: '$CLI_BOARD'. Will attempt auto-detection."
      ;;
  esac
fi

if [ -z "$BOARD_TYPE" ]; then
  if [ -f /proc/device-tree/model ]; then
    DT_MODEL=$(tr -d '\0' < /proc/device-tree/model 2>/dev/null || cat /proc/device-tree/model 2>/dev/null || true)
    if echo "$DT_MODEL" | grep -qi "Raspberry Pi"; then
      BOARD_TYPE="pi"
      BOARD_REASON="Auto-detected (/proc/device-tree/model: $DT_MODEL)"
    elif echo "$DT_MODEL" | grep -qiE "uno.*q|QRB2210|Dragonwing"; then
      BOARD_TYPE="unoq"
      BOARD_REASON="Auto-detected (/proc/device-tree/model: $DT_MODEL)"
    fi
  fi
  if [ -z "$BOARD_TYPE" ] && [ -f /sys/firmware/devicetree/base/model ]; then
    SYS_MODEL=$(tr -d '\0' < /sys/firmware/devicetree/base/model 2>/dev/null || cat /sys/firmware/devicetree/base/model 2>/dev/null || true)
    if echo "$SYS_MODEL" | grep -qi "Raspberry Pi"; then
      BOARD_TYPE="pi"
      BOARD_REASON="Auto-detected (/sys/firmware/devicetree/base/model: $SYS_MODEL)"
    elif echo "$SYS_MODEL" | grep -qiE "uno.*q|QRB2210|Dragonwing"; then
      BOARD_TYPE="unoq"
      BOARD_REASON="Auto-detected (/sys/firmware/devicetree/base/model: $SYS_MODEL)"
    fi
  fi
  if [ -z "$BOARD_TYPE" ] && command -v arduino-cli >/dev/null 2>&1; then
    if arduino-cli board list 2>/dev/null | grep -qi "uno.*q"; then
      BOARD_TYPE="unoq"
      BOARD_REASON="Auto-detected via arduino-cli board list (uno.q)"
    fi
  fi
  if [ -z "$BOARD_TYPE" ]; then
    BOARD_TYPE="generic"
    BOARD_REASON="Generic Linux (no Pi or Uno Q hardware signature detected)"
  fi
fi

# 0.5. Service User Resolution with Board-Aware Fallback & Validation
TARGET_USER=""
USER_REASON=""
if [ -n "$CLI_USER" ]; then
  TARGET_USER="$CLI_USER"
  USER_REASON="Manually specified via CLI (--user=$CLI_USER)"
fi
if [ -z "$TARGET_USER" ] && [ -n "${SUDO_USER:-}" ] && [ "$SUDO_USER" != "root" ]; then
  TARGET_USER="$SUDO_USER"
  USER_REASON="Detected from sudo invocation (\$SUDO_USER)"
fi
if [ -z "$TARGET_USER" ] || [ "$TARGET_USER" = "root" ]; then
  LOGIN_USER=$(logname 2>/dev/null || true)
  if [ -n "$LOGIN_USER" ] && [ "$LOGIN_USER" != "root" ]; then
    TARGET_USER="$LOGIN_USER"
    USER_REASON="Detected from active login session (logname)"
  fi
fi

# Board-aware validation & fallback if user is undetermined or doesn't exist
if [ -z "$TARGET_USER" ] || [ "$TARGET_USER" = "root" ] || ! id "$TARGET_USER" &>/dev/null; then
  PREV_USER="$TARGET_USER"
  if [ "$BOARD_TYPE" = "pi" ]; then
    if id "pi" &>/dev/null; then
      TARGET_USER="pi"
      USER_REASON="Board-aware fallback for Raspberry Pi (user 'pi' exists)"
    else
      TARGET_USER=$(awk -F: '$3 >= 1000 && $3 < 60000 && $1 != "nobody" {print $1; exit}' /etc/passwd 2>/dev/null || echo "pi")
      USER_REASON="Board-aware fallback for Raspberry Pi (primary human user)"
    fi
  elif [ "$BOARD_TYPE" = "unoq" ]; then
    if id "arduino" &>/dev/null; then
      TARGET_USER="arduino"
      USER_REASON="Board-aware fallback for Arduino Uno Q (user 'arduino' exists)"
    else
      TARGET_USER=$(awk -F: '$3 >= 1000 && $3 < 60000 && $1 != "nobody" {print $1; exit}' /etc/passwd 2>/dev/null || echo "arduino")
      USER_REASON="Board-aware fallback for Arduino Uno Q (primary human user)"
    fi
  else
    if id "pi" &>/dev/null; then
      TARGET_USER="pi"
      USER_REASON="Fallback to detected user 'pi'"
    elif id "arduino" &>/dev/null; then
      TARGET_USER="arduino"
      USER_REASON="Fallback to detected user 'arduino'"
    else
      TARGET_USER=$(awk -F: '$3 >= 1000 && $3 < 60000 && $1 != "nobody" {print $1; exit}' /etc/passwd 2>/dev/null || echo "pi")
      USER_REASON="Fallback to primary human user"
    fi
  fi
  if [ -n "$PREV_USER" ] && [ "$PREV_USER" != "$TARGET_USER" ]; then
    USER_REASON="$USER_REASON (previous '$PREV_USER' was non-existent or root)"
  fi
fi

if [ -z "$TARGET_USER" ] || [ "$TARGET_USER" = "root" ]; then
  if [ "$BOARD_TYPE" = "unoq" ]; then
    TARGET_USER="arduino"
  else
    TARGET_USER="pi"
  fi
  USER_REASON="Default fallback based on board ($BOARD_TYPE)"
fi

TARGET_HOME=$(getent passwd "$TARGET_USER" 2>/dev/null | cut -d: -f6)
if [ -z "$TARGET_HOME" ]; then
  TARGET_HOME="/home/$TARGET_USER"
fi

if id "$TARGET_USER" &>/dev/null; then
  USER_STATUS="Account exists (UID: $(id -u "$TARGET_USER"), GID: $(id -g "$TARGET_USER"))"
else
  USER_STATUS="Notice: Account does not yet exist; will attempt creation or fallback"
fi

MCU_ACTION="COMPILE & UPLOAD to onboard Uno Q MCU (arduino:zephyr:unoq on 172.17.0.1)"
if [ "$BOARD_TYPE" = "pi" ]; then
  MCU_ACTION="SKIP (Raspberry Pi - External USB Arduino used)"
elif [ "$SKIP_SKETCH" = "true" ]; then
  MCU_ACTION="SKIP (--skip-sketch specified)"
elif [ "$BOARD_TYPE" = "generic" ]; then
  MCU_ACTION="SKIP (Generic Linux - External USB Arduino used)"
fi

INSTALL_DIR="/opt/racecoordinatorai"
echo "=========================================================="
echo " Race Coordinator AI Installation Configuration"
echo "=========================================================="
echo " Hardware Platform: $BOARD_TYPE"
echo "   Resolution:      $BOARD_REASON"
echo " Service Account:   $TARGET_USER"
echo "   Resolution:      $USER_REASON"
echo "   Home Directory:  $TARGET_HOME"
echo "   Account Status:  $USER_STATUS"
echo " Target Directory:  $INSTALL_DIR"
echo " MCU Firmware:      $MCU_ACTION"
echo " Systemd Services:  racecoordinatorai.service, racecoordinatorai-kiosk.service"
echo " Sudoers Rule:      /etc/sudoers.d/racecoordinatorai (passwordless restart)"
echo " Web UI Port:       7070"
echo "=========================================================="
echo ""

# 1. System prerequisites check and auto-installation
REQUIRED_PKGS=(default-jre-headless chromium wmctrl espeak-ng speech-dispatcher speech-dispatcher-espeak-ng alsa-utils git curl unzip)
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

# Ensure arduino-cli is installed for Uno Q onboard microcontroller
if [ "$BOARD_TYPE" = "unoq" ] && ! command -v arduino-cli >/dev/null 2>&1; then
  echo "Installing arduino-cli for Arduino Uno Q onboard MCU..."
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
if id "$TARGET_USER" &>/dev/null; then
  echo "Configuring permissions for user: $TARGET_USER..."
  chown -R "$TARGET_USER:$TARGET_USER" "$INSTALL_DIR"
  usermod -a -G dialout,audio "$TARGET_USER" 2>/dev/null || true

  # Enable user linger so systemd user services and sockets initialize on boot
  if command -v loginctl >/dev/null 2>&1; then
    loginctl enable-linger "$TARGET_USER" 2>/dev/null || true
  fi

  # Enable Speech Dispatcher socket for user TTS
  if command -v systemctl >/dev/null 2>&1; then
    systemctl -M "$TARGET_USER@" --user enable --now speech-dispatcher.socket 2>/dev/null || \
    su - "$TARGET_USER" -c "systemctl --user enable --now speech-dispatcher.socket" 2>/dev/null || true
  fi

  # Allow user to restart racecoordinatorai services without password for in-app auto-updates
  if [ -d "/etc/sudoers.d" ]; then
    echo "Configuring sudoers permissions for $TARGET_USER auto-update service restart..."
    cat << SUDO_EOF > /etc/sudoers.d/racecoordinatorai
$TARGET_USER ALL=(ALL) NOPASSWD: /bin/systemctl restart racecoordinatorai, /bin/systemctl restart racecoordinatorai-kiosk, /usr/bin/systemctl restart racecoordinatorai, /usr/bin/systemctl restart racecoordinatorai-kiosk
SUDO_EOF
    chmod 0440 /etc/sudoers.d/racecoordinatorai
  fi
fi

# 4. Systemd service registration and boot auto-start
echo "Registering systemd services for user: $TARGET_USER..."
TARGET_UID=$(id -u "$TARGET_USER" 2>/dev/null || echo "1000")
sed -i "s|^User=.*|User=$TARGET_USER|" "$INSTALL_DIR/systemd/racecoordinatorai.service"
sed -i "s|^User=.*|User=$TARGET_USER|" "$INSTALL_DIR/systemd/racecoordinatorai-kiosk.service"
sed -i "s|XAUTHORITY=.*|XAUTHORITY=$TARGET_HOME/.Xauthority|" "$INSTALL_DIR/systemd/racecoordinatorai-kiosk.service"
sed -i "s|/run/user/1000|/run/user/$TARGET_UID|g" "$INSTALL_DIR/systemd/racecoordinatorai-kiosk.service"

cp "$INSTALL_DIR/systemd/racecoordinatorai.service" /etc/systemd/system/
cp "$INSTALL_DIR/systemd/racecoordinatorai-kiosk.service" /etc/systemd/system/

systemctl daemon-reload
systemctl enable racecoordinatorai.service
systemctl enable racecoordinatorai-kiosk.service

# 5. Microcontroller firmware compile and upload
if [ "$BOARD_TYPE" = "pi" ] || [ "$SKIP_SKETCH" = "true" ]; then
  echo ""
  echo "=========================================================="
  if [ "$BOARD_TYPE" = "pi" ]; then
    echo " Raspberry Pi detected ($BOARD_TYPE):"
  else
    echo " MCU sketch upload skipped (--skip-sketch specified):"
  fi
  echo " - Skipping Arduino Uno Q onboard MCU firmware upload."
  echo " - Connect your external Arduino via USB (typically /dev/ttyACM0 or /dev/ttyUSB0)."
  echo "=========================================================="
elif [ "$BOARD_TYPE" = "unoq" ] || (command -v arduino-cli >/dev/null 2>&1 && arduino-cli board list 2>/dev/null | grep -qi "uno.*q"); then
  if command -v arduino-cli >/dev/null 2>&1; then
    echo "Checking microcontroller core, libraries, and firmware..."
    if ! arduino-cli core list 2>/dev/null | grep -q "arduino:zephyr"; then
      echo ""
      echo "=========================================================================="
      echo " Installing Zephyr board core (arduino:zephyr)..."
      echo " - Downloads ~500MB+ and installs the RTOS & ARM cross-compiler toolchain."
      echo " - Estimated Time: 5 to 10+ minutes depending on network & eMMC storage."
      echo " - Time to grab a coffee! Live progress is displayed below."
      echo "=========================================================================="
      echo ""
      arduino-cli core update-index $VERBOSE_FLAG || true
      arduino-cli core install $VERBOSE_FLAG arduino:zephyr || true
    fi

    echo "Installing required Arduino libraries (Arduino_RouterBridge)..."
    arduino-cli lib update-index $VERBOSE_FLAG || true
    arduino-cli lib install $VERBOSE_FLAG Arduino_RouterBridge || true

    BOARD_INFO=$(arduino-cli board list 2>/dev/null | grep -i "uno.*q" | head -n1)
    PORT=$(echo "$BOARD_INFO" | awk '{print $1}')
    FQBN=$(echo "$BOARD_INFO" | grep -o 'arduino:[a-zA-Z0-9_:]*' | head -n1)
    if [ -z "$FQBN" ] || [ "$FQBN" = "arduino:stm32" ] || [ "$FQBN" = "Q" ]; then
      FQBN="arduino:zephyr:unoq"
    fi
    if [ -z "$PORT" ]; then
      PORT="172.17.0.1"
    fi

    if [ -d "$INSTALL_DIR/arduino/racecoordinatorai_sketch" ]; then
      echo ""
      echo "Compiling and uploading sketch to $FQBN on $PORT..."
      echo "Note: Initial Zephyr compilation builds the RTOS kernel and takes ~1-2 minutes..."
      if ! arduino-cli compile $VERBOSE_FLAG --fqbn "$FQBN" "$INSTALL_DIR/arduino/racecoordinatorai_sketch"; then
        echo "Notice: Sketch compilation encountered a warning/error. Continuing installation..."
      elif ! (arduino-cli upload -p "$PORT" --fqbn "$FQBN" --upload-field password=arduino "$INSTALL_DIR/arduino/racecoordinatorai_sketch" 2>/dev/null || \
              arduino-cli upload -p "$PORT" --fqbn "$FQBN" "$INSTALL_DIR/arduino/racecoordinatorai_sketch"); then
        echo "Notice: MCU upload to $PORT was busy or not ready. Continuing installation..."
      else
        echo "Firmware upload successful!"
      fi
    fi
  fi
else
  echo ""
  echo "Non-Uno-Q board detected: Skipping onboard MCU firmware upload."
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

CLI_BOARD=""
CLI_USER=""

while [ $# -gt 0 ]; do
  case "$1" in
    --board=*)
      CLI_BOARD="${1#*=}"
      shift
      ;;
    --board)
      CLI_BOARD="$2"
      shift 2
      ;;
    --pi|--raspberry-pi|--rpi)
      CLI_BOARD="pi"
      shift
      ;;
    --unoq|--uno-q|--arduino)
      CLI_BOARD="unoq"
      shift
      ;;
    --user=*)
      CLI_USER="${1#*=}"
      shift
      ;;
    --user)
      CLI_USER="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: sudo ./manual_install.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --board=<pi|unoq|generic>  Specify board type (auto-detected by default)"
      echo "  --user=<username>          Service user account (auto-detected by default)"
      echo "  -h, --help                 Display this help message"
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

BOARD_TYPE=""
BOARD_REASON=""
if [ -n "$CLI_BOARD" ]; then
  case "$(echo "$CLI_BOARD" | tr '[:upper:]' '[:lower:]')" in
    pi|raspberry*|rpi)
      BOARD_TYPE="pi"
      BOARD_REASON="Manually specified via CLI (--board=$CLI_BOARD)"
      ;;
    uno*|arduino)
      BOARD_TYPE="unoq"
      BOARD_REASON="Manually specified via CLI (--board=$CLI_BOARD)"
      ;;
    generic|pc|other)
      BOARD_TYPE="generic"
      BOARD_REASON="Manually specified via CLI (--board=$CLI_BOARD)"
      ;;
  esac
fi

if [ -z "$BOARD_TYPE" ]; then
  if [ -f /proc/device-tree/model ]; then
    DT_MODEL=$(tr -d '\0' < /proc/device-tree/model 2>/dev/null || cat /proc/device-tree/model 2>/dev/null || true)
    if echo "$DT_MODEL" | grep -qi "Raspberry Pi"; then
      BOARD_TYPE="pi"
      BOARD_REASON="Auto-detected (/proc/device-tree/model: $DT_MODEL)"
    elif echo "$DT_MODEL" | grep -qiE "uno.*q|QRB2210|Dragonwing"; then
      BOARD_TYPE="unoq"
      BOARD_REASON="Auto-detected (/proc/device-tree/model: $DT_MODEL)"
    fi
  fi
  if [ -z "$BOARD_TYPE" ] && [ -f /sys/firmware/devicetree/base/model ]; then
    SYS_MODEL=$(tr -d '\0' < /sys/firmware/devicetree/base/model 2>/dev/null || cat /sys/firmware/devicetree/base/model 2>/dev/null || true)
    if echo "$SYS_MODEL" | grep -qi "Raspberry Pi"; then
      BOARD_TYPE="pi"
      BOARD_REASON="Auto-detected (/sys/firmware/devicetree/base/model: $SYS_MODEL)"
    elif echo "$SYS_MODEL" | grep -qiE "uno.*q|QRB2210|Dragonwing"; then
      BOARD_TYPE="unoq"
      BOARD_REASON="Auto-detected (/sys/firmware/devicetree/base/model: $SYS_MODEL)"
    fi
  fi
  if [ -z "$BOARD_TYPE" ] && command -v arduino-cli >/dev/null 2>&1; then
    if arduino-cli board list 2>/dev/null | grep -qi "uno.*q"; then
      BOARD_TYPE="unoq"
      BOARD_REASON="Auto-detected via arduino-cli board list (uno.q)"
    fi
  fi
  if [ -z "$BOARD_TYPE" ]; then
    BOARD_TYPE="generic"
    BOARD_REASON="Generic Linux (no Pi or Uno Q hardware signature detected)"
  fi
fi

TARGET_USER=""
USER_REASON=""
if [ -n "$CLI_USER" ]; then
  TARGET_USER="$CLI_USER"
  USER_REASON="Manually specified via CLI (--user=$CLI_USER)"
fi
if [ -z "$TARGET_USER" ] && [ -n "${SUDO_USER:-}" ] && [ "$SUDO_USER" != "root" ]; then
  TARGET_USER="$SUDO_USER"
  USER_REASON="Detected from sudo invocation (\$SUDO_USER)"
fi
if [ -z "$TARGET_USER" ] || [ "$TARGET_USER" = "root" ]; then
  LOGIN_USER=$(logname 2>/dev/null || true)
  if [ -n "$LOGIN_USER" ] && [ "$LOGIN_USER" != "root" ]; then
    TARGET_USER="$LOGIN_USER"
    USER_REASON="Detected from active login session (logname)"
  fi
fi
if [ -z "$TARGET_USER" ] || [ "$TARGET_USER" = "root" ] || ! id "$TARGET_USER" &>/dev/null; then
  PREV_USER="$TARGET_USER"
  if [ "$BOARD_TYPE" = "pi" ]; then
    if id "pi" &>/dev/null; then
      TARGET_USER="pi"
      USER_REASON="Board-aware fallback for Raspberry Pi (user 'pi' exists)"
    else
      TARGET_USER=$(awk -F: '$3 >= 1000 && $3 < 60000 && $1 != "nobody" {print $1; exit}' /etc/passwd 2>/dev/null || echo "pi")
      USER_REASON="Board-aware fallback for Raspberry Pi (primary human user)"
    fi
  elif [ "$BOARD_TYPE" = "unoq" ]; then
    if id "arduino" &>/dev/null; then
      TARGET_USER="arduino"
      USER_REASON="Board-aware fallback for Arduino Uno Q (user 'arduino' exists)"
    else
      TARGET_USER=$(awk -F: '$3 >= 1000 && $3 < 60000 && $1 != "nobody" {print $1; exit}' /etc/passwd 2>/dev/null || echo "arduino")
      USER_REASON="Board-aware fallback for Arduino Uno Q (primary human user)"
    fi
  else
    if id "pi" &>/dev/null; then
      TARGET_USER="pi"
      USER_REASON="Fallback to detected user 'pi'"
    elif id "arduino" &>/dev/null; then
      TARGET_USER="arduino"
      USER_REASON="Fallback to detected user 'arduino'"
    else
      TARGET_USER=$(awk -F: '$3 >= 1000 && $3 < 60000 && $1 != "nobody" {print $1; exit}' /etc/passwd 2>/dev/null || echo "pi")
      USER_REASON="Fallback to primary human user"
    fi
  fi
  if [ -n "$PREV_USER" ] && [ "$PREV_USER" != "$TARGET_USER" ]; then
    USER_REASON="$USER_REASON (previous '$PREV_USER' was non-existent or root)"
  fi
fi
if [ -z "$TARGET_USER" ] || [ "$TARGET_USER" = "root" ]; then
  if [ "$BOARD_TYPE" = "unoq" ]; then
    TARGET_USER="arduino"
  else
    TARGET_USER="pi"
  fi
  USER_REASON="Default fallback based on board ($BOARD_TYPE)"
fi

TARGET_HOME=$(getent passwd "$TARGET_USER" 2>/dev/null | cut -d: -f6)
if [ -z "$TARGET_HOME" ]; then
  TARGET_HOME="/home/$TARGET_USER"
fi

if id "$TARGET_USER" &>/dev/null; then
  USER_STATUS="Account exists (UID: $(id -u "$TARGET_USER"), GID: $(id -g "$TARGET_USER"))"
else
  USER_STATUS="Notice: Account does not yet exist; will attempt creation or fallback"
fi

INSTALL_DIR="/opt/racecoordinatorai"
echo "=========================================================="
echo " Race Coordinator AI Manual Installation Configuration"
echo "=========================================================="
echo " Hardware Platform: $BOARD_TYPE"
echo "   Resolution:      $BOARD_REASON"
echo " Service Account:   $TARGET_USER"
echo "   Resolution:      $USER_REASON"
echo "   Home Directory:  $TARGET_HOME"
echo "   Account Status:  $USER_STATUS"
echo " Target Directory:  $INSTALL_DIR"
echo " Systemd Services:  racecoordinatorai.service, racecoordinatorai-kiosk.service"
echo " Sudoers Rule:      /etc/sudoers.d/racecoordinatorai (passwordless restart)"
echo " Web UI Port:       7070"
echo "=========================================================="
echo ""
mkdir -p "$INSTALL_DIR"
CURRENT_DIR="$(pwd -P)"
TARGET_DIR="$(cd "$INSTALL_DIR" 2>/dev/null && pwd -P || echo "$INSTALL_DIR")"
if [ "$CURRENT_DIR" != "$TARGET_DIR" ]; then
  cp -r ./* "$INSTALL_DIR/"
fi

if id "$TARGET_USER" &>/dev/null; then
  chown -R "$TARGET_USER:$TARGET_USER" "$INSTALL_DIR"
  usermod -a -G dialout,audio "$TARGET_USER" 2>/dev/null || true

  if command -v loginctl >/dev/null 2>&1; then
    loginctl enable-linger "$TARGET_USER" 2>/dev/null || true
  fi

  if command -v systemctl >/dev/null 2>&1; then
    systemctl -M "$TARGET_USER@" --user enable --now speech-dispatcher.socket 2>/dev/null || \
    su - "$TARGET_USER" -c "systemctl --user enable --now speech-dispatcher.socket" 2>/dev/null || true
  fi

  if [ -d "/etc/sudoers.d" ]; then
    cat << SUDO_EOF > /etc/sudoers.d/racecoordinatorai
$TARGET_USER ALL=(ALL) NOPASSWD: /bin/systemctl restart racecoordinatorai, /bin/systemctl restart racecoordinatorai-kiosk, /usr/bin/systemctl restart racecoordinatorai, /usr/bin/systemctl restart racecoordinatorai-kiosk
SUDO_EOF
    chmod 0440 /etc/sudoers.d/racecoordinatorai
  fi
fi

TARGET_UID=$(id -u "$TARGET_USER" 2>/dev/null || echo "1000")
sed -i "s|^User=.*|User=$TARGET_USER|" "$INSTALL_DIR/systemd/racecoordinatorai.service"
sed -i "s|^User=.*|User=$TARGET_USER|" "$INSTALL_DIR/systemd/racecoordinatorai-kiosk.service"
sed -i "s|XAUTHORITY=.*|XAUTHORITY=$TARGET_HOME/.Xauthority|" "$INSTALL_DIR/systemd/racecoordinatorai-kiosk.service"
sed -i "s|/run/user/1000|/run/user/$TARGET_UID|g" "$INSTALL_DIR/systemd/racecoordinatorai-kiosk.service"

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
