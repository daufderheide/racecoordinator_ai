#!/bin/bash
set -e

echo "=== Building server ==="
cd server
mvn clean package -DskipTests

echo "=== Building Windows Installers ==="
./create_installers.sh

echo "=== Building Linux ARM64 Release (Arduino UNO Q) ==="
./create_linux_arm64_release.sh

echo "=== Release OK ==="