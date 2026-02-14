#!/bin/bash
set -e

echo "Building Race Coordinator Release..."

# 1. Clean and Build Client
echo "Building Client..."
cd client
npm install
npm run build
cd ..

# 2. Clean and Build Server (Fat Jar)
echo "Building Server..."
cd server
mvn clean
chmod +x generate_protos.sh
./generate_protos.sh
mvn package -DskipTests
cd ..

# 3. Download JREs for Offline Installer
echo "Downloading JREs for Offline Installer..."
mkdir -p build_cache
if [ ! -s build_cache/java8.zip ]; then
    echo "Downloading Java 8 (x86/32-bit for XP Compatibility)..."
    curl -L "https://api.adoptium.net/v3/binary/latest/8/ga/windows/x86/jdk/hotspot/normal/eclipse?project=jdk" -o build_cache/java8.zip || echo "Warning: Java 8 download failed"
else
    echo "Java 8 already exists in build_cache, skipping download."
fi

if [ ! -s build_cache/java17.zip ]; then
    echo "Downloading Java 17 (x64)..."
    curl -L "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk" -o build_cache/java17.zip || echo "Warning: Java 17 download failed"
else
    echo "Java 17 already exists in build_cache, skipping download."
fi

# 4. Create Release Directory Structure
echo "Creating Release Structure..."
rm -rf release 2>/dev/null || true
mkdir -p release/RaceCoordinator/web
mkdir -p release/RaceCoordinator_Offline/web

# Copy Artifacts to both
for dir in release/RaceCoordinator release/RaceCoordinator_Offline; do
    cp server/target_dist/server-1.0-SNAPSHOT.jar "$dir/RaceCoordinator.jar"
    cp -r client/dist/client/* "$dir/web/"
done

# Copy Offline Bundles
if [ -r build_cache/java8.zip ]; then
    cp build_cache/java8.zip release/RaceCoordinator_Offline/bundled_jre8.zip
else
    echo "Warning: build_cache/java8.zip not readable, skipping offline bundle"
fi

if [ -r build_cache/java17.zip ]; then
    cp build_cache/java17.zip release/RaceCoordinator_Offline/bundled_jre17.zip
else
    echo "Warning: build_cache/java17.zip not readable, skipping offline bundle"
fi

# 5. Create Launch Scripts

create_scripts() {
    local DEST_DIR=$1
    
    # Mac Launch Script
    cat > "$DEST_DIR/start_mac.command" << 'EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"
if type -p java > /dev/null; then
    echo "Starting Race Coordinator..."
    java -jar RaceCoordinator.jar "$@"
else
    osascript -e 'display alert "Java Required" message "Java is not installed. Please install Java 8 or newer."'
fi
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

$Url = ""
$BundledZip = ""
if ($OSVersion.Major -lt 10) {
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

# 6. Create Installers / Packages

echo "Creating Zip packages..."
cd release
zip -r RaceCoordinator_Universal.zip RaceCoordinator
zip -r RaceCoordinator_Windows_Offline.zip RaceCoordinator_Offline
cd ..

# DMG for Mac (if on Mac)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Creating Mac DMG..."
    mkdir -p release/dmg_content
    cp -r release/RaceCoordinator/* release/dmg_content/
    hdiutil create -volname "RaceCoordinator" -srcfolder release/dmg_content -ov -format UDZO release/RaceCoordinator_Mac.dmg || echo "Warning: Mac DMG creation failed, but continuing..."
    rm -rf release/dmg_content
fi

echo "Build Complete!"
echo "Artifacts in 'release/' directory."
