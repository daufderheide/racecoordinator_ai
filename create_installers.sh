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

# 3. Create Release Directory Structure
echo "Creating Release Structure..."
rm -rf release
mkdir -p release/RaceCoordinator/web

# Copy Artifacts
cp server/target/server-1.0-SNAPSHOT.jar release/RaceCoordinator/RaceCoordinator.jar
cp -r client/dist/client/* release/RaceCoordinator/web/

# 4. Create Launch Scripts

# Mac Launch Script (.command is clickable)
cat > release/RaceCoordinator/start_mac.command << 'EOF'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"
if type -p java > /dev/null; then
    echo "Starting Race Coordinator..."
    # Open browser after a slight delay
    (sleep 5 && open "http://localhost:7070") &
    java -jar RaceCoordinator.jar "$@"
else
    osascript -e 'display alert "Java Required" message "Java is not installed. Please install Java 8 or newer."'
fi
EOF
chmod +x release/RaceCoordinator/start_mac.command

# Linux / RPi Launch Script
cat > release/RaceCoordinator/start_linux_rpi.sh << 'EOF'
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
chmod +x release/RaceCoordinator/start_linux_rpi.sh

# Windows Launch Script
cat > release/RaceCoordinator/start_win.bat << 'EOF'
@echo off
setlocal

REM Check for local JRE first
if exist "%~dp0jre\bin\java.exe" (
    set "JAVA_CMD=%~dp0jre\bin\java.exe"
    goto :RunApp
)

REM Check for system Java
java -version >nul 2>&1
if %errorlevel% equ 0 (
    set "JAVA_CMD=java"
    goto :RunApp
)

REM No Java found
echo Java is not installed.
echo Please run setup_windows.bat to automatically install dependencies.
echo.
pause
exit /b

:RunApp
start "" "http://localhost:7070"
"%JAVA_CMD%" -jar RaceCoordinator.jar %*
EOF

# Windows Setup Script (Install Dependencies)
cat > release/RaceCoordinator/setup_windows.bat << 'EOF'
@echo off
pushd "%~dp0"
echo Running Race Coordinator Setup...
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0install_dependencies.ps1'"
pause
popd
EOF

# PowerShell Dependency Installer
cat > release/RaceCoordinator/install_dependencies.ps1 << 'EOF'
$ErrorActionPreference = "Stop"

# PowerShell 2.0 Compatibility: Determine Script Path manually
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Checking for Java..."

# Check only for local JRE
$LocalJava = Join-Path $ScriptPath "jre\bin\java.exe"
if (Test-Path $LocalJava) {
    Write-Host "Local Java Runtime is already installed." -ForegroundColor Green
    exit
}

# WinXP Detection (Version 5.x)
$OSVersion = [System.Environment]::OSVersion.Version
Write-Host "Detected Windows Version: $($OSVersion.Major).$($OSVersion.Minor)"

$Url = ""
if ($OSVersion.Major -lt 10) {
    # Windows XP / 7 / 8 / 8.1
    Write-Host "Legacy Windows detected (XP/7/8). Selecting Java 8." -ForegroundColor Yellow
    $Url = "https://api.adoptium.net/v3/binary/latest/8/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk"
} else {
    # Windows 10 / 11
    Write-Host "Modern Windows detected (10/11). Selecting Java 17." -ForegroundColor Cyan
    $Url = "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk"
}

$ZipPath = Join-Path $ScriptPath "java.zip"

Write-Host "Downloading Java Runtime..." -ForegroundColor Cyan

$ZipPath = Join-Path $ScriptPath "java.zip"

Write-Host "Downloading Java Runtime..." -ForegroundColor Cyan

# Attempt download logic
$DownloadSuccess = $false

# Enable TLS 1.2 (required for modern servers) if possible
# 3072 is Tls12. This fixes "Underlying connection closed" on Win7.
try {
    [System.Net.ServicePointManager]::SecurityProtocol = 3072
} catch {
    # Ignore on older systems (XP) where this might fail
}

# Method 1: CertUtil (Win 7+)
# Note: Can sometimes fail with OOM on small VMs, so we just try it.
if (-not $DownloadSuccess) {
    if (Get-Command certutil -ErrorAction SilentlyContinue) {
        Write-Host "Attempting download via CertUtil..." -ForegroundColor Gray
        try {
            $proc = Start-Process -FilePath "certutil.exe" -ArgumentList "-urlcache", "-split", "-f", "`"$Url`"", "`"$ZipPath`"" -Wait -NoNewWindow -PassThru
            if ($proc.ExitCode -eq 0 -and (Test-Path $ZipPath)) {
                $DownloadSuccess = $true
            }
        } catch {
            Write-Warning "CertUtil download failed."
        }
    }
}

# Method 2: WebClient (Legacy / fallback)
if (-not $DownloadSuccess) {
    Write-Host "Attempting download via WebClient..." -ForegroundColor Gray
    try {
        $WebClient = New-Object System.Net.WebClient
        $WebClient.DownloadFile($Url, $ZipPath)
        $DownloadSuccess = $true
    } catch {
        Write-Warning "WebClient download failed: $_"
    }
}

# Method 3: BITSAdmin (XP+, Robust against OOM/TLS sometimes)
if (-not $DownloadSuccess) {
    if (Get-Command bitsadmin -ErrorAction SilentlyContinue) {
        Write-Host "Attempting download via BITSAdmin..." -ForegroundColor Gray
        try {
            # bitsadmin /transfer <JobName> <RemoteURL> <LocalName>
            Start-Process -FilePath "bitsadmin.exe" -ArgumentList "/transfer", "JavaDownload", "$Url", "$ZipPath" -Wait -NoNewWindow
            if (Test-Path $ZipPath) {
                 $DownloadSuccess = $true
            }
        } catch {
             Write-Warning "BITSAdmin failed."
        }
    }
}

if (-not $DownloadSuccess) {
    Write-Warning "All automated download methods failed (likely due to TLS issues on this OS)."
    Write-Host "Opening your browser to download Java manually..." -ForegroundColor Yellow
    
    # Open Browser
    Start-Process "$Url"
    
    Write-Host ""
    Write-Host "ACTION REQUIRED:" -ForegroundColor Red
    Write-Host "1. Save the file as 'java.zip' in this folder:"
    Write-Host "   $ScriptPath"
    Write-Host "2. Once saved, press any key to continue..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

# Verify file exists (either downloaded automatically or manually)
if (-not (Test-Path $ZipPath)) {
    Write-Error "java.zip not found. Setup cannot continue."
    exit
}

try {
    Write-Host "Extracting..." -ForegroundColor Cyan
    
    # PS 2.0 Compatibility: Use Shell.Application for zip extraction if Expand-Archive is missing
    if (Get-Command Expand-Archive -ErrorAction SilentlyContinue) {
        Expand-Archive -Path $ZipPath -DestinationPath $ScriptPath -Force
    } else {
        $Shell = New-Object -ComObject Shell.Application
        $ZipFolder = $Shell.NameSpace($ZipPath)
        $DestFolder = $Shell.NameSpace($ScriptPath)
        $DestFolder.CopyHere($ZipFolder.Items())
    }
    
    # Rename extracted folder to 'jre'
    # PS 2.0 Compatibility: Use explicit container check
    $Folders = Get-ChildItem -Path $ScriptPath | Where-Object { $_.PSIsContainer -and $_.Name -like "jdk*" }
    
    # Handle array result if multiple folders match (though unlikely) or single item
    if ($Folders -is [array]) { $extractedDir = $Folders[0] } else { $extractedDir = $Folders }

    if ($extractedDir) {
        Rename-Item -Path $extractedDir.FullName -NewName "jre"
        Write-Host "Java installed successfully!" -ForegroundColor Green
    } else {
        Write-Error "Could not find extracted Java directory."
    }
} catch {
    Write-Error "Failed to install Java: $_"
    Write-Host "Error details: You may need to manually download Java from $Url and extract it to a 'jre' folder here." -ForegroundColor Red
} finally {
    if (Test-Path $ZipPath) { Remove-Item $ZipPath }
}
EOF

# 5. Create Installers / Packages

# Create README
cat > release/RaceCoordinator/README.txt << 'EOF'
Race Coordinator
================

Prerequisites:
- Java Runtime Environment (JRE) 8 or newer.

Installation/Running:
- Mac: Double-click start_mac.command
- Windows: Double-click start_win.bat
- Linux / Raspberry Pi: Run ./start_linux_rpi.sh

Troubleshooting:
- If MongoDB fails to start (common on Raspberry Pi), you can use a system-installed MongoDB:
  1. Install MongoDB: sudo apt-get install mongodb-server
  2. Run with flag: ./start_linux_rpi.sh --no-embedded-mongo

- Ensure ports 7070 (Web) and 27017 (MongoDB) are free.
EOF

# Zip for Windows/Linux
echo "Creating Zip package..."
cd release
zip -r RaceCoordinator_Universal.zip RaceCoordinator
cd ..

# DMG for Mac (if on Mac)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Creating Mac DMG..."
    # Create a temporary folder for DMG content
    mkdir -p release/dmg_content
    cp -r release/RaceCoordinator release/dmg_content/
    
    # Use hdiutil to create DMG
    hdiutil create -volname "RaceCoordinator" -srcfolder release/dmg_content -ov -format UDZO release/RaceCoordinator_Mac.dmg
    
    rm -rf release/dmg_content
fi

echo "Build Complete!"
echo "Artifacts in 'release/' directory."
