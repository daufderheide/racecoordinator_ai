#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "=== Building server ==="
cd server
mvn clean package -DskipTests

echo "=== Deploying JAR ==="
mkdir -p ../release/RaceCoordinator ../release/RaceCoordinator_Offline
cp target_dist/server-1.0-SNAPSHOT.jar ../release/RaceCoordinator/RaceCoordinator.jar
cp target_dist/server-1.0-SNAPSHOT.jar ../release/RaceCoordinator_Offline/RaceCoordinator.jar

echo "=== Release OK ==="