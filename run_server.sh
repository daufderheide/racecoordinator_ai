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

is_rc_running() {
  if command -v curl >/dev/null 2>&1; then
    local ver=$(curl -s -m 1 "http://localhost:${SERVER_PORT}/api/version" 2>/dev/null)
    if [ -n "$ver" ]; then
      return 0
    fi
  fi
  local server_pid=$(get_port_listening_pid "$SERVER_PORT")
  if [ -n "$server_pid" ]; then
    local cmd=$(ps -p "$server_pid" -o command= 2>/dev/null | tr '[:upper:]' '[:lower:]')
    if [[ "$cmd" =~ racecoordinator|com\.antigravity\.app ]]; then
      return 0
    fi
  fi
  local client_pid=$(get_port_listening_pid "$CLIENT_PORT")
  if [ -n "$client_pid" ]; then
    local cmd=$(ps -p "$client_pid" -o command= 2>/dev/null | tr '[:upper:]' '[:lower:]')
    if [[ "$cmd" =~ racecoordinator|ng[[:space:]]+serve ]]; then
      return 0
    fi
  fi
  return 1
}

coordinate_already_running() {
  local status_json=""
  if command -v curl >/dev/null 2>&1; then
    status_json=$(curl -s -m 1 "http://localhost:${SERVER_PORT}/api/server/status" 2>/dev/null)
  fi

  local active_clients=$(echo "$status_json" | grep -o '"activeClients":[0-9]*' | cut -d: -f2)
  local is_pending_shutdown=$(echo "$status_json" | grep -o '"pendingShutdown":true')

  # Layer 1: Instant takeover if 0 clients or already shutting down
  if [ "$is_pending_shutdown" = '"pendingShutdown":true' ] || [ "$active_clients" = "0" ]; then
    echo "Existing Race Coordinator AI instance has 0 active clients (or is shutting down). Taking over..."
    curl -s -m 2 -X POST "http://localhost:${SERVER_PORT}/api/server/shutdown" >/dev/null 2>&1 || true
    local c_pid=$(get_port_listening_pid "$CLIENT_PORT")
    if [ -n "$c_pid" ]; then
      pkill -P "$c_pid" 2>/dev/null || true
      kill -TERM "$c_pid" 2>/dev/null || true
    fi
    for i in {1..20}; do
      if ! is_port_in_use "$CLIENT_PORT" && ! is_port_in_use "$SERVER_PORT"; then
        break
      fi
      sleep 0.2
    done
    return 0
  fi

  if [ "$HEADLESS" = true ]; then
    echo "Race Coordinator AI is already running on port ${SERVER_PORT}. Headless mode detected, exiting cleanly."
    exit 0
  fi

  local choice=""
  if [ "$(uname)" = "Darwin" ]; then
    choice=$(osascript <<EOF 2>/dev/null
try
  set theDialog to display dialog "Race Coordinator AI is already running on port ${SERVER_PORT}\nHow do you want to proceed?" with title "Race Coordinator AI - Already Running" buttons {"Do nothing, abort", "Stop current session and restart", "Run in existing session"} default button "Run in existing session" with icon note
  return button returned of theDialog
on error
  return "Do nothing, abort"
end try
EOF
    )
  elif command -v zenity >/dev/null 2>&1; then
    choice=$(zenity --list --title="Race Coordinator AI - Already Running" \
      --text="Race Coordinator AI is already running on port ${SERVER_PORT}\nHow do you want to proceed?" \
      --column="Action" \
      "Run in existing session" \
      "Stop current session and restart" \
      "Do nothing, abort" \
      --height=240 --width=360 2>/dev/null)
    if [ -z "$choice" ]; then choice="Do nothing, abort"; fi
  elif command -v kdialog >/dev/null 2>&1; then
    choice=$(kdialog --combobox "Race Coordinator AI is already running on port ${SERVER_PORT}\nHow do you want to proceed?" "Run in existing session" "Stop current session and restart" "Do nothing, abort" --default "Run in existing session" --title "Race Coordinator AI - Already Running" 2>/dev/null)
    if [ -z "$choice" ]; then choice="Do nothing, abort"; fi
  else
    echo ""
    echo "Race Coordinator AI is already running on port ${SERVER_PORT}"
    echo "How do you want to proceed?"
    echo "  1) Run in existing session"
    echo "  2) Stop current session and restart"
    echo "  3) Do nothing, abort"
    read -r -p "Enter choice [1-3] (default 1): " term_choice
    case "$term_choice" in
      2) choice="Stop current session and restart" ;;
      3) choice="Do nothing, abort" ;;
      *) choice="Run in existing session" ;;
    esac
  fi

  if [ "$choice" = "Run in existing session" ] || [ "$choice" = "Open Web Browser" ]; then
    echo "User selected 'Run in existing session'."
    local target_url="http://localhost:7070"
    if is_port_in_use "$CLIENT_PORT"; then
      target_url="http://localhost:$CLIENT_PORT"
    fi
    if [ "$(uname)" = "Darwin" ]; then
      open "$target_url"
    elif command -v xdg-open >/dev/null 2>&1; then
      xdg-open "$target_url"
    fi
    exit 0
  elif [ "$choice" = "Stop current session and restart" ] || [ "$choice" = "Restart Application" ]; then
    echo "User selected 'Stop current session and restart'. Stopping existing instance..."
    curl -s -m 2 -X POST "http://localhost:${SERVER_PORT}/api/server/shutdown" >/dev/null 2>&1 || true
    local c_pid=$(get_port_listening_pid "$CLIENT_PORT")
    if [ -n "$c_pid" ]; then
      pkill -P "$c_pid" 2>/dev/null || true
      kill -TERM "$c_pid" 2>/dev/null || true
    fi
    local s_pid=$(get_port_listening_pid "$SERVER_PORT")
    if [ -n "$s_pid" ]; then
      kill -TERM "$s_pid" 2>/dev/null || true
    fi
    for i in {1..25}; do
      if ! is_port_in_use "$CLIENT_PORT" && ! is_port_in_use "$SERVER_PORT"; then
        break
      fi
      sleep 0.2
    done
    if is_port_in_use "$CLIENT_PORT" || is_port_in_use "$SERVER_PORT"; then
      if command -v lsof >/dev/null 2>&1; then
        lsof -ti :"$CLIENT_PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true
        lsof -ti :"$SERVER_PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true
      fi
    fi
    echo "Existing instance stopped. Starting new instance..."
    return 0
  else
    echo "User selected 'Do nothing, abort' (or closed dialog). Exiting cleanly."
    exit 0
  fi
}

# Coordinate if Race Coordinator AI is already running
if { [ "$HEADLESS" = false ] && is_port_in_use "$CLIENT_PORT"; } || is_port_in_use "$SERVER_PORT"; then
  if is_rc_running; then
    coordinate_already_running
  fi
fi

# Pre-flight port availability checks for foreign / third-party processes
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
