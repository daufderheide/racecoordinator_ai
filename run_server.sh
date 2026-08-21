#!/bin/bash

HEADLESS=false
SERVER_PORT=7070
CLIENT_PORT=4200

for ((i=1; i<=$#; i++)); do
  arg="${!i}"
  if [ "$arg" = "--headless" ]; then
    HEADLESS=true
  elif [ "$arg" = "--port" ] || [ "$arg" = "-p" ]; then
    next_idx=$((i+1))
    SERVER_PORT="${!next_idx}"
  elif [[ "$arg" == --port=* ]]; then
    SERVER_PORT="${arg#*=}"
  fi
done

if [ -n "$PORT" ]; then SERVER_PORT="$PORT"; fi
if [ -n "$SERVER_PORT_ENV" ]; then SERVER_PORT="$SERVER_PORT_ENV"; fi

is_port_in_use() {
  local port=$1
  if command -v lsof >/dev/null 2>&1; then
    lsof -i:"$port" -t >/dev/null 2>&1
    return $?
  elif command -v nc >/dev/null 2>&1; then
    nc -z 127.0.0.1 "$port" >/dev/null 2>&1
    return $?
  else
    (echo > /dev/tcp/127.0.0.1/"$port") >/dev/null 2>&1
    return $?
  fi
}

show_gui_error() {
  local title="$1"
  local message="$2"
  echo "PORT CONFLICT ERROR - $title: $message"
  if [ "$(uname)" = "Darwin" ]; then
    osascript -e "display dialog \"$message\" with title \"$title\" buttons {\"OK\"} default button \"OK\" with icon stop" >/dev/null 2>&1 &
  elif command -v zenity >/dev/null 2>&1; then
    zenity --error --title="$title" --text="$message" >/dev/null 2>&1 &
  elif command -v kdialog >/dev/null 2>&1; then
    kdialog --error "$message" --title "$title" >/dev/null 2>&1 &
  fi
}

# Pre-flight port availability checks
if [ "$HEADLESS" = false ] && is_port_in_use "$CLIENT_PORT"; then
  show_gui_error "Race Coordinator AI - Client Port Conflict" "Failed to start Angular Client on port $CLIENT_PORT.\nPort $CLIENT_PORT is already in use by another process.\n\nPlease terminate the process using port $CLIENT_PORT and try again."
  exit 1
fi

if is_port_in_use "$SERVER_PORT"; then
  show_gui_error "Race Coordinator AI - Web Server Port Conflict" "Failed to start Web Server on port $SERVER_PORT.\nPort $SERVER_PORT is already in use by another process.\n\nPlease terminate the process using port $SERVER_PORT or start with '--port <port'."
  exit 1
fi

cleanup() {
  trap - EXIT INT TERM
  if [ ! -z "$CLIENT_PID" ]; then
    pkill -P $CLIENT_PID 2>/dev/null || true
    kill -TERM $CLIENT_PID 2>/dev/null || true
    sleep 0.2
    kill -9 $CLIENT_PID 2>/dev/null || true
  fi
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti :"$CLIENT_PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti :"$SERVER_PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

if [ "$HEADLESS" = false ]; then
  echo "Starting Angular Client..."
  "$(dirname "$0")/run_client.sh" --open &
  CLIENT_PID=$!
fi

cd "$(dirname "$0")/server"
# Ensure protobuf generation is up to date and clean build is performed


chmod +x generate_protos.sh

# Use target_generated to avoid conflicts with locked target_dev
export PROTO_DEST_DIR="$(pwd)/target_generated_3"
mkdir -p "$PROTO_DEST_DIR"

mvn clean -Dbuild.dist.dir="$PROTO_DEST_DIR" -Dmaven.repo.local="$(pwd)/.m2/repository" || true
./generate_protos.sh --server-only

export MAVEN_OPTS="-Djava.library.path=$(pwd)/lib/macos"
mvn compile exec:java -Dbuild.dist.dir="$PROTO_DEST_DIR" -Dexec.mainClass="com.antigravity.App" -Dexec.args="--headless" -DLOG_DIR="$(pwd)/../data_v3" -Dapp.data.dir="$(pwd)/../data_v3" -Dde.flapdoodle.embed.io.tmpdir="$(pwd)/../data_v3/server_temp" -Dmaven.repo.local="$(pwd)/.m2/repository"
