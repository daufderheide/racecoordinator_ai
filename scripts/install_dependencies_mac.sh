#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Check if running from read-only volume (e.g. DMG mount)
if [ ! -w . ]; then
    osascript -e 'display alert "Read-Only Volume" message "Please drag or copy the Race Coordinator folder to your Applications or Desktop folder before running setup." as critical' > /dev/null 2>&1
    exit 1
fi

echo "========================================="
echo "  Race Coordinator Dependency Installer  "
echo "========================================="

# Prompt user using osascript (GUI Prompt)
# Since this runs in terminal, we can use osascript for a nice dialog
osascript -e 'display dialog "Do you want to download Java 17 and MongoDB 4.4? This is required to run Race Coordinator on this Mac. This will require an internet connection." buttons {"Yes", "No"} default button "Yes" with title "Race Coordinator Setup"' > /dev/null 2>&1

if [ $? -ne 0 ]; then
    echo "Setup cancelled by user."
    exit 1
fi

echo "Starting download..."

# Detect Architecture
ARCH=$(uname -m)
echo "Detected architecture: $ARCH"

DOWNLOAD_SUCCESS=true

# 1. Download Java 17
if [ ! -s "jre/bin/java" ]; then
    echo "-----------------------------------------"
    echo "Downloading Java 17..."
    if [ "$ARCH" == "arm64" ]; then
        URL="https://api.adoptium.net/v3/binary/latest/17/ga/mac/aarch64/jdk/hotspot/normal/eclipse?project=jdk"
    else
        URL="https://api.adoptium.net/v3/binary/latest/17/ga/mac/x64/jdk/hotspot/normal/eclipse?project=jdk"
    fi
    
    rm -f java_temp.tar.gz
    curl -L "$URL" -o java_temp.tar.gz || DOWNLOAD_SUCCESS=false
    
    if [ "$DOWNLOAD_SUCCESS" = true ] && [ -f java_temp.tar.gz ]; then
        echo "Extracting Java..."
        mkdir -p jre
        tar -zxf java_temp.tar.gz -C jre --strip-components 1
        
        # Flatten Mac JDK Structure (move Contents/Home contents to top)
        if [ -d "jre/Contents/Home" ]; then
            echo "Organizing Java files..."
            rm -rf jre/include jre/lib jre/bin 2>/dev/null || true # Clean if exists
            mv jre/Contents/Home/* jre/
            rm -rf jre/Contents
        fi
        
        rm -f java_temp.tar.gz
        if [ -f "jre/bin/java" ]; then
            chmod +x jre/bin/java
            echo "✅ Java 17 installed successfully to ./jre"
        else
            echo "❌ Error: Java binary not found after extraction."
            DOWNLOAD_SUCCESS=false
        fi
    else
        echo "❌ Error: Java 17 download failed."
        DOWNLOAD_SUCCESS=false
    fi
else
    echo "✅ Java 17 is already installed in ./jre"
fi

# 2. Download MongoDB 4.4
if [ ! -s "mongodb/bin/mongod" ]; then
    echo "-----------------------------------------"
    echo "Downloading MongoDB 4.4..."
    # MongoDB 4.4 for macOS is x86_64, runs via Rosetta 2 on Apple Silicon
    URL="https://fastdl.mongodb.org/osx/mongodb-macos-x86_64-4.4.30.tgz"
    
    rm -f mongo_temp.tgz
    curl -L "$URL" -o mongo_temp.tgz || DOWNLOAD_SUCCESS=false
    
    if [ "$DOWNLOAD_SUCCESS" = true ] && [ -f mongo_temp.tgz ]; then
        echo "Extracting MongoDB..."
        mkdir -p temp_mongo
        tar -zxf mongo_temp.tgz -C temp_mongo --strip-components 1
        
        mkdir -p mongodb/bin
        if [ -f "temp_mongo/bin/mongod" ]; then
            mv temp_mongo/bin/mongod mongodb/bin/
            chmod +x mongodb/bin/mongod
            echo "✅ MongoDB installed successfully to ./mongodb"
        else
            echo "❌ Error: mongod binary not found in downloaded package."
            DOWNLOAD_SUCCESS=false
        fi
        rm -rf temp_mongo mongo_temp.tgz
    else
        echo "❌ Error: MongoDB download failed."
        DOWNLOAD_SUCCESS=false
    fi
else
    echo "✅ MongoDB is already installed in ./mongodb"
fi

echo "-----------------------------------------"
if [ "$DOWNLOAD_SUCCESS" = true ]; then
    echo "🎉 Setup Complete! You can now run start_mac.command"
    osascript -e 'display dialog "Setup Complete! You can now run start_mac.command" buttons {"OK"} with title "Race Coordinator Setup"' > /dev/null 2>&1
else
    echo "⚠️ Setup completed with errors. Please check the logs above."
    osascript -e 'display alert "Setup Failed" message "One or more downloads failed. Please check the terminal output for details."' > /dev/null 2>&1
fi
