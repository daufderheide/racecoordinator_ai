#!/bin/bash

HEADLESS=false
for arg in "$@"; do
  if [ "$arg" = "--headless" ]; then
    HEADLESS=true
  fi
done

if [ "$HEADLESS" = false ]; then
  echo "Starting Angular Client..."
  "$(dirname "$0")/run_client.sh" --open &
  CLIENT_PID=$!
  trap 'kill $CLIENT_PID 2>/dev/null' EXIT
fi

cd "$(dirname "$0")/server"

# Find and kill any process using port 7070, 8085, or 4200
for port in 7070 8085 4200; do
  if command -v lsof >/dev/null 2>&1; then
    pids=$(lsof -t -i:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
      echo "Killing stale process(es) on port $port..."
      kill -9 $pids 2>/dev/null || true
    fi
  elif command -v fuser >/dev/null 2>&1; then
    fuser -k $port/tcp >/dev/null 2>&1 || true
  fi
done
# Run mvn clean first to ensure a fresh build, but this removes protoc executable if we are not careful.
# Actually, mvn clean removes target/. 
# So generated_protos.sh needs to handle missing protoc.
# My script handles it by running `mvn protobuf:compile` if missing (which downloads it).
# But `mvn clean` removes it. 
# So:
# 1. mvn clean -> target gone.
# 2. generate_protos.sh -> runs mvn protobuf:compile (downloads protoc, maybe fails generation but that's ok).
# 3. generate_protos.sh -> runs protoc manually (SUCCESS).
# 4. mvn compile exec:java


chmod +x generate_protos.sh

# Use target_generated to avoid conflicts with locked target_dev
export PROTO_DEST_DIR="$(pwd)/target_generated_3"
mkdir -p "$PROTO_DEST_DIR"

mvn clean -Dbuild.dist.dir="$PROTO_DEST_DIR" -Dmaven.repo.local="$(pwd)/.m2/repository" || true
./generate_protos.sh --server-only

export MAVEN_OPTS="-Djava.library.path=$(pwd)/lib/macos"
mvn compile exec:java -Dbuild.dist.dir="$PROTO_DEST_DIR" -Dexec.mainClass="com.antigravity.App" -Dexec.args="--headless" -DLOG_DIR="$(pwd)/../data_v3" -Dapp.data.dir="$(pwd)/../data_v3" -Dde.flapdoodle.embed.io.tmpdir="$(pwd)/../data_v3/server_temp" -Dmaven.repo.local="$(pwd)/.m2/repository"
