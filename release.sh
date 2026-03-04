#!/bin/bash
set -e

echo "=== Building server ==="
cd server
mvn clean package -DskipTests

echo "=== Deploying JAR ==="
cp target_dist/server-1.0-SNAPSHOT.jar ../release/RaceCoordinator/RaceCoordinator.jar
cp target_dist/server-1.0-SNAPSHOT.jar ../release/RaceCoordinator_Offline/RaceCoordinator.jar

echo "=== Release OK ==="