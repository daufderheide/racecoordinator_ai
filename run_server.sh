#!/bin/bash

HEADLESS=false
SERVER_PORT=7070
CLIENT_PORT=4200
REPLAY_LOG=""

for ((i=1; i<=$#; i++)); do
  arg="${!i}"
  if [ "$arg" = "--headless" ]; then
    HEADLESS=true
  elif [ "$arg" = "--port" ] || [ "$arg" = "-p" ]; then
    next_idx=$((i+1))
    SERVER_PORT="${!next_idx}"
  elif [[ "$arg" == --port=* ]]; then
    SERVER_PORT="${arg#*=}"
  elif [ "$arg" = "--replay" ] || [ "$arg" = "-r" ]; then
    next_idx=$((i+1))
    REPLAY_LOG="${!next_idx}"
  elif [[ "$arg" == --replay=* ]]; then
    REPLAY_LOG="${arg#*=}"
  fi
done

if [ -n "$PORT" ]; then SERVER_PORT="$PORT"; fi
if [ -n "$SERVER_PORT_ENV" ]; then SERVER_PORT="$SERVER_PORT_ENV"; fi
if [ -n "$REPLAY_LOG_ENV" ]; then REPLAY_LOG="$REPLAY_LOG_ENV"; fi

if [ -n "$REPLAY_LOG" ]; then
  if [[ "$REPLAY_LOG" != /* ]]; then
    REPLAY_LOG="$(pwd)/$REPLAY_LOG"
  fi
fi

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

get_port_listening_pid() {
  local port=$1
  local pid=""
  if command -v lsof >/dev/null 2>&1; then
    pid=$(lsof -n -P -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n 1)
    if [ -z "$pid" ]; then
      pid=$(lsof -i:"$port" -t 2>/dev/null | head -n 1)
    fi
  elif command -v fuser >/dev/null 2>&1; then
    pid=$(fuser "$port"/tcp 2>/dev/null | tr -d ' ' | head -n 1)
  elif command -v ss >/dev/null 2>&1; then
    pid=$(ss -lptn "sport = :$port" 2>/dev/null | grep -o 'pid=[0-9]*' | head -n 1 | cut -d= -f2)
  fi
  echo "$pid"
}

resolve_app_description() {
  local proc_name="$1"
  local cmd_line="$2"
  local lower_cmd=$(echo "$cmd_line" | tr '[:upper:]' '[:lower:]')

  if [[ "$lower_cmd" =~ racecoordinator|com\.antigravity\.app|com\.antigravity\. ]]; then
    if [[ "$lower_cmd" =~ app|server ]]; then
      echo "Race Coordinator AI Server (another instance is already running)"
    elif [[ "$lower_cmd" =~ ng|client ]]; then
      echo "Race Coordinator AI Client (Angular dev server)"
    else
      echo "Race Coordinator AI (another instance is already running)"
    fi
  elif [[ "$lower_cmd" =~ ng(\.js|\.cmd|\.ps1)?[[:space:]]+serve|@angular/cli ]]; then
    echo "Angular Dev Server"
  elif [[ "$proc_name" =~ ^java(w)?(\.exe)?$ ]]; then
    if [[ "$cmd_line" =~ -jar[[:space:]]+[\"\']?([^\"\'[:space:]]+\.jar)[\"\']? ]]; then
      local jar_path="${BASH_REMATCH[1]}"
      local jar_name=$(basename "$jar_path")
      echo "Java Application ($jar_name)"
    else
      echo "Java Application"
    fi
  elif [[ "$proc_name" =~ ^node(\.exe)?$ ]]; then
    echo "Node.js Application"
  fi
}

build_port_conflict_message() {
  local port=$1
  local service_name="$2"
  local pid=$(get_port_listening_pid "$port")

  local msg="Failed to start $service_name on port $port."

  if [ -n "$pid" ] && [ "$pid" -gt 0 ] 2>/dev/null; then
    local proc_name=$(ps -p "$pid" -o comm= 2>/dev/null | xargs)
    local cmd_line=$(ps -p "$pid" -o command= 2>/dev/null | xargs)
    local app_desc=$(resolve_app_description "$proc_name" "$cmd_line")

    msg="$msg\n\nPort $port is currently in use by another application:"
    if [ -n "$app_desc" ]; then
      msg="$msg\n  • Application: $app_desc"
    fi
    if [ -n "$proc_name" ]; then
      msg="$msg\n  • Process: $proc_name (PID: $pid)"
    else
      msg="$msg\n  • PID: $pid"
    fi
    if [ -n "$cmd_line" ]; then
      local short_cmd="$cmd_line"
      if [ ${#short_cmd} -gt 140 ]; then
        short_cmd="${short_cmd:0:140}..."
      fi
      msg="$msg\n  • Command: $short_cmd"
    fi

    msg="$msg\n\nTroubleshooting Steps:"
    msg="$msg\n1. Close or terminate the conflicting application (PID: $pid)."
    if [[ "$app_desc" =~ "Race Coordinator AI" ]]; then
      msg="$msg\n   Another instance of Race Coordinator AI appears to already be running."
    fi
  else
    msg="$msg\n\nPort $port is already in use by another process or unavailable.\n\nTroubleshooting Steps:\n1. Terminate the process using port $port, or restart your computer."
  fi

  if [ "$service_name" = "Web Server" ]; then
    msg="$msg\n2. Or start with '--port <port>' (or set SERVER_PORT / PORT environment variable)."
  else
    msg="$msg\n2. Or start in headless mode with '--headless' if you only need the server."
  fi

  echo "$msg"
}

show_gui_error() {
  local title="$1"
  local message="$2"
  printf "\n\033[1;31mPORT CONFLICT ERROR - %s:\033[0m\n%b\n\n" "$title" "$message"
  if [ "$(uname)" = "Darwin" ]; then
    local escaped_msg=$(printf "%b" "$message" | sed 's/\\/\\\\/g; s/"/\\"/g')
    osascript <<EOF >/dev/null 2>&1 &
display dialog "$escaped_msg" with title "$title" buttons {"OK"} default button "OK" with icon stop
EOF
  elif command -v zenity >/dev/null 2>&1; then
    local formatted_msg=$(printf "%b" "$message")
    zenity --error --title="$title" --text="$formatted_msg" >/dev/null 2>&1 &
  elif command -v kdialog >/dev/null 2>&1; then
    local formatted_msg=$(printf "%b" "$message")
    kdialog --error "$formatted_msg" --title "$title" >/dev/null 2>&1 &
  fi
}

# Pre-flight port availability checks
if [ "$HEADLESS" = false ] && is_port_in_use "$CLIENT_PORT"; then
  conflict_msg=$(build_port_conflict_message "$CLIENT_PORT" "Angular Client")
  show_gui_error "Race Coordinator AI - Client Port Conflict" "$conflict_msg"
  exit 1
fi

if is_port_in_use "$SERVER_PORT"; then
  conflict_msg=$(build_port_conflict_message "$SERVER_PORT" "Web Server")
  show_gui_error "Race Coordinator AI - Web Server Port Conflict" "$conflict_msg"
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

export MAVEN_OPTS="-Djava.library.path=$(pwd)/lib/macos ${MAVEN_OPTS:-}"
REPLAY_FLAG=""
if [ -n "$REPLAY_LOG" ]; then
  REPLAY_FLAG="-DenableLogReplay=$REPLAY_LOG"
fi
mvn compile exec:java -Dbuild.dist.dir="$PROTO_DEST_DIR" -Dexec.mainClass="com.antigravity.App" -Dexec.args="--headless" -DLOG_DIR="$(pwd)/../data_v3" -Dapp.data.dir="$(pwd)/../data_v3" -Dde.flapdoodle.embed.io.tmpdir="$(pwd)/../data_v3/server_temp" -Dmaven.repo.local="$(pwd)/.m2/repository" $REPLAY_FLAG
