#!/bin/bash
set -e

# Use a separate build directory for release builds to avoid the IDE's background
# Java compiler racing with Maven (the IDE watches target_dist from pom.xml).
RELEASE_BUILD_DIR="target_release"

echo "Building Race Coordinator Release..."

# 0. Check for Analytics Credentials
ANALYTICS_FILE="server/src/main/resources/analytics.properties"
if [ ! -f "$ANALYTICS_FILE" ]; then
    echo "ERROR: $ANALYTICS_FILE is missing!"
    echo "This file is required for analytics to work in the production build."
    echo "Please create it using the keys from the secure vault before publishing a release."
    exit 1
fi

# 1. Clean and Build Client
echo "Building Client..."
cd client
NPM_CONFIG_CACHE="$(pwd)/.npm_cache" npm install
npm run build
cd ..

# 2. Clean and Build Server (Modern and Legacy versions)
echo "Building Server (Modern - Java 11)..."
cd server
mvn clean -Dbuild.dist.dir=$RELEASE_BUILD_DIR
chmod +x generate_protos.sh
PROTO_DEST_DIR="$(pwd)/$RELEASE_BUILD_DIR" ./generate_protos.sh --server-only
mvn package -Dmaven.test.skip=true -Dbuild.dist.dir=$RELEASE_BUILD_DIR -DskipProtobuf=true
cd ..

# Initialize Release Structure
echo "Creating Release Structure..."
rm -rf release 2>/dev/null || true
mkdir -p release/RaceCoordinator/web
mkdir -p release/RaceCoordinator/jre8
mkdir -p release/RaceCoordinator/jre17
mkdir -p release/RaceCoordinator/mongodb32
mkdir -p release/RaceCoordinator/mongodb60
mkdir -p release/RaceCoordinator_Offline/web

# Copy Modern Artifacts
cp server/$RELEASE_BUILD_DIR/server-1.0-SNAPSHOT.jar release/RaceCoordinator/RaceCoordinator.jar
cp -r client/dist/client/* release/RaceCoordinator/web/
cp -r server/src/main/resources/arduino release/RaceCoordinator/

echo "Building Server (Legacy - Java 1.8 Profile)..."
cd server
mvn clean -Dbuild.dist.dir=$RELEASE_BUILD_DIR
PROTO_DEST_DIR="$(pwd)/$RELEASE_BUILD_DIR" ./generate_protos.sh --server-only
mvn package -Plegacy -Dmaven.test.skip=true -Dbuild.dist.dir=$RELEASE_BUILD_DIR -DskipProtobuf=true
cd ..

# Copy Legacy Artifacts
cp server/$RELEASE_BUILD_DIR/server-1.0-SNAPSHOT.jar release/RaceCoordinator_Offline/RaceCoordinator.jar
cp -r client/dist/client/* release/RaceCoordinator_Offline/web/
cp -r server/src/main/resources/arduino release/RaceCoordinator_Offline/

# 3. Download Dependencies for Offline Installer
echo "Downloading Dependencies for Offline Installer..."
mkdir build_cache 2>/dev/null || true

# Java 8 (x86/32-bit for XP/7 Compatibility)
if [ ! -s build_cache/java8.zip ]; then
    echo "Downloading Java 8..."
    curl -L "https://api.adoptium.net/v3/binary/latest/8/ga/windows/x86/jdk/hotspot/normal/eclipse?project=jdk" -o build_cache/java8.zip || echo "Warning: Java 8 download failed"
fi

# Java 17 (x64 for Win 10/11)
if [ ! -s build_cache/java17.zip ]; then
    echo "Downloading Java 17..."
    curl -L "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk" -o build_cache/java17.zip || echo "Warning: Java 17 download failed"
fi

# MongoDB 3.2 (32-bit for Legacy Windows)
if [ ! -s build_cache/mongodb32.zip ]; then
    echo "Downloading MongoDB 3.2 (32-bit)..."
    curl -L "https://fastdl.mongodb.org/win32/mongodb-win32-i386-3.2.22.zip" -o build_cache/mongodb32.zip || echo "Warning: MongoDB 3.2 download failed"
fi

# MongoDB 6.0 (64-bit for Modern Windows)
if [ ! -s build_cache/mongodb60.zip ]; then
    echo "Downloading MongoDB 6.0 (64-bit)..."
    curl -L "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.21.zip" -o build_cache/mongodb60.zip || echo "Warning: MongoDB 6.0 download failed"
fi

# VC++ Redist 2015-2022 (x64)
if [ ! -s build_cache/vc_redist.x64.exe ]; then
    echo "Downloading VC++ Redistributable (x64)..."
    curl -L "https://aka.ms/vs/17/release/vc_redist.x64.exe" -o build_cache/vc_redist.x64.exe || echo "Warning: VC++ Redist download failed"
fi

# VC++ Redist 2013 (x86)
if [ ! -s build_cache/vcredist_x86.exe ]; then
    echo "Downloading VC++ Redistributable 2013 (x86)..."
    curl -L "https://aka.ms/highdpimfc2013x86enu" -o build_cache/vcredist_x86.exe || echo "Warning: VC++ Redist 2013 download failed"
fi

# 4. Extract and Bundle Dependencies
if [ -r build_cache/java8.zip ]; then
    cp build_cache/java8.zip release/RaceCoordinator_Offline/bundled_jre8.zip
    echo "Extracting JRE 8 (Legacy Support)..."
    unzip -q build_cache/java8.zip -d release/RaceCoordinator/temp_jre8
    mv release/RaceCoordinator/temp_jre8/*/* release/RaceCoordinator/jre8/
    rm -rf release/RaceCoordinator/temp_jre8
fi


if [ -r build_cache/java17.zip ]; then
    cp build_cache/java17.zip release/RaceCoordinator_Offline/bundled_jre17.zip
    echo "Extracting JRE 17 (Modern Support)..."
    unzip -q build_cache/java17.zip -d release/RaceCoordinator/temp_jre17
    mv release/RaceCoordinator/temp_jre17/*/* release/RaceCoordinator/jre17/
    rm -rf release/RaceCoordinator/temp_jre17
fi

if [ -r build_cache/mongodb32.zip ]; then
    echo "Extracting MongoDB 3.2..."
    unzip -q build_cache/mongodb32.zip -d release/RaceCoordinator/temp_mongo32
    mv release/RaceCoordinator/temp_mongo32/*/* release/RaceCoordinator/mongodb32/
    rm -rf release/RaceCoordinator/temp_mongo32
fi

if [ -r build_cache/mongodb60.zip ]; then
    echo "Extracting MongoDB 6.0..."
    unzip -q build_cache/mongodb60.zip -d release/RaceCoordinator/temp_mongo60
    mv release/RaceCoordinator/temp_mongo60/*/* release/RaceCoordinator/mongodb60/
    rm -rf release/RaceCoordinator/temp_mongo60
fi

if [ -f build_cache/vc_redist.x64.exe ]; then
    cp build_cache/vc_redist.x64.exe release/RaceCoordinator/vc_redist.x64.exe
fi

if [ -f build_cache/vcredist_x86.exe ]; then
    cp build_cache/vcredist_x86.exe release/RaceCoordinator/vcredist_x86.exe
fi




# 5. Create Launch Scripts

create_scripts() {
    local DEST_DIR=$1
    
    # Mac Launch Script
cat > "$DEST_DIR/start_mac.command" << 'EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Check if running from read-only volume (e.g. DMG mount)
if [ ! -w . ]; then
    osascript -e 'display alert "Read-Only Volume" message "Please drag or copy the Race Coordinator folder to your Applications or Desktop folder before running it." as critical' > /dev/null 2>&1
    exit 1
fi

echo "Checking Java..."
# 1. Check Local JRE (Downloaded via script)
if [ -x "jre/bin/java" ]; then
    echo "Using local Java..."
    JAVA_CMD="jre/bin/java"
# 2. Check System Java
elif type -p java > /dev/null; then
    echo "Using system Java..."
    JAVA_CMD="java"
else
    echo "Java not found."
    osascript -e 'display dialog "Java is not installed. Do you want to download dependencies now?" buttons {"Yes", "No"} default button "Yes" with title "Race Coordinator Setup"' > /dev/null 2>&1
    if [ $? -eq 0 ]; then
        if [ -f "install_dependencies_mac.sh" ]; then
            chmod +x install_dependencies_mac.sh
            # Run downloader in a visible terminal window
            osascript -e 'tell application "Terminal" to do script "cd \"'"$DIR"'\" && ./install_dependencies_mac.sh && exit"'
            exit 0
        else
            osascript -e 'display alert "Error" message "install_dependencies_mac.sh not found."'
        fi
    fi
    exit 1
fi

echo "Starting Race Coordinator..."
"$JAVA_CMD" -jar RaceCoordinator.jar "$@"
EOF
    chmod +x "$DEST_DIR/start_mac.command"

    # Linux / RPi Launch Script
    cat > "$DEST_DIR/start_linux_rpi.sh" << 'EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"
if type -p java > /dev/null; then
    echo "Starting Race Coordinator..."
    java -jar RaceCoordinator.jar "$@"
else
    echo "Java is not installed. Please install Java 8 (openjdk-8-jre)."
    echo "On Raspberry Pi: sudo apt-get install openjdk-8-jre"
fi
EOF
    chmod +x "$DEST_DIR/start_linux_rpi.sh"

    # Windows Launch Script
    cat > "$DEST_DIR/start_win.bat" << 'EOF'
@echo off
setlocal
pushd "%~dp0"
if exist "%~dp0jre\bin\java.exe" (
    set "JAVA_CMD=%~dp0jre\bin\java.exe"
    goto :RunApp
)
java -version >nul 2>&1
if %errorlevel% equ 0 (
    set "JAVA_CMD=java"
    goto :RunApp
)
echo Java is not installed.
echo Please run setup_windows.bat to automatically install dependencies.
echo.
pause
popd
exit /b
:RunApp
"%JAVA_CMD%" -jar RaceCoordinator.jar %*
popd
EOF

    # Windows Setup Script
    cat > "$DEST_DIR/setup_windows.bat" << 'EOF'
@echo off
pushd "%~dp0"
echo Running Race Coordinator Setup...
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0install_dependencies.ps1'"
pause
popd
EOF

    # PowerShell Dependency Installer (Updated for Offline support)
    cat > "$DEST_DIR/install_dependencies.ps1" << 'EOF'
$ErrorActionPreference = "Stop"
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Checking for Java..."
$LocalJava = Join-Path $ScriptPath "jre\bin\java.exe"
if (Test-Path $LocalJava) {
    Write-Host "Local Java Runtime is already installed." -ForegroundColor Green
    exit
}

$OSVersion = [System.Environment]::OSVersion.Version
Write-Host "Detected Windows Version: $($OSVersion.Major).$($OSVersion.Minor)"

if ($OSVersion.Major -ge 10) {
    $VCRedistPath = Join-Path $ScriptPath "vc_redist.x64.exe"
    if (Test-Path $VCRedistPath) {
        Write-Host "Installing bundled VC++ Redistributable (x64)..." -ForegroundColor Cyan
        try {
            Start-Process -FilePath $VCRedistPath -ArgumentList "/install /quiet /norestart" -Wait -NoNewWindow
        } catch {
            Write-Warning "VC++ Redist installation failed."
        }
    }
}

$Url = ""
$BundledZip = ""
if ($OSVersion.Major -lt 10) {
    $VCRedist86Path = Join-Path $ScriptPath "vcredist_x86.exe"
    if (Test-Path $VCRedist86Path) {
        Write-Host "Installing bundled VC++ Redistributable 2013 (x86)..." -ForegroundColor Cyan
        try {
            Start-Process -FilePath $VCRedist86Path -ArgumentList "/install /quiet /norestart" -Wait -NoNewWindow
        } catch {
            Write-Warning "VC++ Redist 2013 installation failed."
        }
    }

    Write-Host "Legacy Windows detected (XP/7/8). Selecting Java 8 (32-bit)." -ForegroundColor Yellow
    $Url = "https://api.adoptium.net/v3/binary/latest/8/ga/windows/x86/jdk/hotspot/normal/eclipse?project=jdk"
    $BundledZip = Join-Path $ScriptPath "bundled_jre8.zip"
} else {
    Write-Host "Modern Windows detected (10/11). Selecting Java 17 (64-bit)." -ForegroundColor Cyan
    $Url = "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk"
    $BundledZip = Join-Path $ScriptPath "bundled_jre17.zip"
}

$ZipPath = Join-Path $ScriptPath "java.zip"
$DownloadSuccess = $false

# OFFLINE CHECK: Use bundled zip if it exists
if (Test-Path $BundledZip) {
    Write-Host "Using bundled offline Java package..." -ForegroundColor Green
    Copy-Item $BundledZip $ZipPath
    $DownloadSuccess = $true
}

if (-not $DownloadSuccess) {
    Write-Host "Downloading Java Runtime..." -ForegroundColor Cyan
    try { [System.Net.ServicePointManager]::SecurityProtocol = 3072 } catch { }
    
    # Method 1: CertUtil
    if (Get-Command certutil -ErrorAction SilentlyContinue) {
        Write-Host "Attempting download via CertUtil..." -ForegroundColor Gray
        try {
            $proc = Start-Process -FilePath "certutil.exe" -ArgumentList "-urlcache", "-split", "-f", "`"$Url`"", "`"$ZipPath`"" -Wait -NoNewWindow -PassThru
            if ($proc.ExitCode -eq 0 -and (Test-Path $ZipPath)) { $DownloadSuccess = $true }
        } catch { Write-Warning "CertUtil download failed." }
    }
    
    # Method 2: WebClient
    if (-not $DownloadSuccess) {
        Write-Host "Attempting download via WebClient..." -ForegroundColor Gray
        try {
            $WebClient = New-Object System.Net.WebClient
            $WebClient.DownloadFile($Url, $ZipPath)
            $DownloadSuccess = $true
        } catch { Write-Warning "WebClient download failed: $_" }
    }

    # Method 3: BITSAdmin
    if (-not $DownloadSuccess) {
        if (Get-Command bitsadmin -ErrorAction SilentlyContinue) {
            Write-Host "Attempting download via BITSAdmin..." -ForegroundColor Gray
            try {
                Start-Process -FilePath "bitsadmin.exe" -ArgumentList "/transfer", "JavaDownload", "$Url", "$ZipPath" -Wait -NoNewWindow
                if (Test-Path $ZipPath) { $DownloadSuccess = $true }
            } catch { Write-Warning "BITSAdmin failed." }
        }
    }
}

if (-not $DownloadSuccess) {
    Write-Warning "All automated download methods failed."
    Write-Host "Opening your browser to download Java manually..." -ForegroundColor Yellow
    Start-Process "$Url"
    Write-Host ""
    Write-Host "ACTION REQUIRED:" -ForegroundColor Red
    Write-Host "1. Save the file as 'java.zip' in this folder: $ScriptPath"
    Write-Host "2. Once saved, press any key to continue..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

if (-not (Test-Path $ZipPath)) {
    Write-Error "java.zip not found. Setup cannot continue."
    exit
}

try {
    Write-Host "Extracting..." -ForegroundColor Cyan
    if (Get-Command Expand-Archive -ErrorAction SilentlyContinue) {
        Expand-Archive -Path $ZipPath -DestinationPath $ScriptPath -Force
    } else {
        $Shell = New-Object -ComObject Shell.Application
        $ZipFolder = $Shell.NameSpace($ZipPath)
        $DestFolder = $Shell.NameSpace($ScriptPath)
        $DestFolder.CopyHere($ZipFolder.Items())
    }
    $Folders = Get-ChildItem -Path $ScriptPath | Where-Object { $_.PSIsContainer -and $_.Name -like "jdk*" }
    if ($Folders -is [array]) { $extractedDir = $Folders[0] } else { $extractedDir = $Folders }
    if ($extractedDir) {
        Rename-Item -Path $extractedDir.FullName -NewName "jre"
        Write-Host "Java installed successfully!" -ForegroundColor Green
    } else {
        Write-Error "Could not find extracted Java directory."
    }
} catch {
    Write-Error "Failed to install Java: $_"
} finally {
    if (Test-Path $ZipPath) { Remove-Item $ZipPath }
}
EOF

    # Create README
    cat > "$DEST_DIR/README.txt" << 'EOF'
Race Coordinator
================

Prerequisites:
- Java Runtime Environment (JRE) 8 or newer.

Installation/Running:
- Mac: Double-click start_mac.command
- Windows: Double-click start_win.bat
- Linux / Raspberry Pi: Run ./start_linux_rpi.sh

Windows Installation Note:
If Java is not found, run setup_windows.bat. 
(Offline version includes pre-bundled Java for no-internet installations).

Troubleshooting:
- If MongoDB fails to start (RPi), install manually: sudo apt-get install mongodb-server
- Ensure ports 7070 (Web) and 27017 (MongoDB) are free.
EOF
}

echo "Generating scripts for standard distribution..."
create_scripts release/RaceCoordinator
echo "Generating scripts for offline distribution..."
create_scripts release/RaceCoordinator_Offline

echo "Manual Step for Windows: Build installers using Inno Setup (installer_online.iss, installer_offline.iss)"
echo "Manual Step for Mac: Run create_mac_dmg.sh on a macOS machine to build the DMG."

echo "Build Complete!"
echo "Artifacts in 'release/' directory."
