$ErrorActionPreference = "Stop"

function Exec {
    param([scriptblock]$ScriptBlock)
    & $ScriptBlock
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code $LASTEXITCODE"
    }
}

# 0. Setup Environment
Write-Host "Setting up environment..." -ForegroundColor Cyan
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User") + ";$env:JAVA_HOME\bin"

Write-Host "Building Race Coordinator Release..." -ForegroundColor Cyan

# 1. Clean and Build Client
Write-Host "Building Client..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\client"
$env:NPM_CONFIG_CACHE = "$(pwd)\.npm_cache"
Exec { npm install }
Exec { npm run build }
Set-Location "$PSScriptRoot"

# 2. Clean and Build Server (Fat Jar)
Write-Host "Building Server..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\server"
Exec { mvn clean "-Dbuild.dist.dir=target_dist" }
if (Get-Command chmod -ErrorAction SilentlyContinue) {
    Exec { chmod +x generate_protos.sh }
}
Exec { ./generate_protos.sh }
Exec { mvn package "-Dmaven.test.skip=true" "-Dbuild.dist.dir=target_dist" }
Set-Location "$PSScriptRoot"

# 3. Download Dependencies for Offline Installer
Write-Host "Downloading Dependencies for Offline Installer..." -ForegroundColor Yellow
if (-not (Test-Path "build_cache")) { New-Item -ItemType Directory -Path "build_cache" }

# Java 8 (x86/32-bit for XP/7 Compatibility)
$Java8Zip = "build_cache\java8.zip"
if (-not (Test-Path $Java8Zip) -or (Get-Item $Java8Zip).Length -eq 0) {
    Write-Host "Downloading Java 8..."
    try {
        Invoke-WebRequest -Uri "https://api.adoptium.net/v3/binary/latest/8/ga/windows/x86/jdk/hotspot/normal/eclipse?project=jdk" -OutFile $Java8Zip
    } catch {
        Write-Warning "Java 8 download failed: $_"
    }
}

# Java 17 (x64 for Win 10/11)
$Java17Zip = "build_cache\java17.zip"
if (-not (Test-Path $Java17Zip) -or (Get-Item $Java17Zip).Length -eq 0) {
    Write-Host "Downloading Java 17..."
    try {
        Invoke-WebRequest -Uri "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk" -OutFile $Java17Zip
    } catch {
        Write-Warning "Java 17 download failed: $_"
    }
}

# MongoDB 3.2 (32-bit for Legacy Windows)
$Mongo32Zip = "build_cache\mongodb32.zip"
if (-not (Test-Path $Mongo32Zip) -or (Get-Item $Mongo32Zip).Length -eq 0) {
    Write-Host "Downloading MongoDB 3.2 (32-bit)..."
    try {
        Invoke-WebRequest -Uri "https://fastdl.mongodb.org/win32/mongodb-win32-i386-3.2.22.zip" -OutFile $Mongo32Zip
    } catch {
        Write-Warning "MongoDB 3.2 download failed: $_"
    }
}

# MongoDB 4.4 (64-bit for Modern Windows)
$Mongo44Zip = "build_cache\mongodb44.zip"
if (-not (Test-Path $Mongo44Zip) -or (Get-Item $Mongo44Zip).Length -eq 0) {
    Write-Host "Downloading MongoDB 4.4 (64-bit)..."
    try {
        Invoke-WebRequest -Uri "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-4.4.26.zip" -OutFile $Mongo44Zip
    } catch {
        Write-Warning "MongoDB 4.4 download failed: $_"
    }
}

# 4. Create Release Directory Structure
Write-Host "Creating Release Structure..." -ForegroundColor Yellow
if (Test-Path "release") { Remove-Item -Path "release" -Recurse -Force -ErrorAction SilentlyContinue }

$ReleaseDirs = @(
    "release\RaceCoordinator\web",
    "release\RaceCoordinator\jre8",
    "release\RaceCoordinator\jre17",
    "release\RaceCoordinator\mongodb32",
    "release\RaceCoordinator\mongodb44",
    "release\RaceCoordinator_Offline\web"
)

foreach ($dir in $ReleaseDirs) { New-Item -ItemType Directory -Path $dir -Force }

# Copy Artifacts
$JarFile = "server\target_dist\server-1.0-SNAPSHOT.jar"
Copy-Item $JarFile "release\RaceCoordinator\RaceCoordinator.jar"
Copy-Item $JarFile "release\RaceCoordinator_Offline\RaceCoordinator.jar"
Copy-Item "client\dist\client\*" "release\RaceCoordinator\web\" -Recurse
Copy-Item "client\dist\client\*" "release\RaceCoordinator_Offline\web\" -Recurse
if (Test-Path "server\src\main\resources\arduino") {
    Copy-Item "server\src\main\resources\arduino" "release\RaceCoordinator\" -Recurse
    Copy-Item "server\src\main\resources\arduino" "release\RaceCoordinator_Offline\" -Recurse
}

# Extract and Bundle Dependencies
function Extract-To-Release {
    param($ZipName, $DestSubDir, $BundleName)
    $ZipPath = Join-Path "build_cache" $ZipName
    if ((Test-Path $ZipPath) -and ((Get-Item $ZipPath).Length -gt 0)) {
        if ($BundleName) {
            Copy-Item $ZipPath "release\RaceCoordinator_Offline\$BundleName"
        }
        Write-Host "Extracting $ZipName..." -ForegroundColor Cyan
        $TempDir = Join-Path "release\RaceCoordinator" "temp_$([System.IO.Path]::GetFileNameWithoutExtension($ZipName))"
        Expand-Archive -Path $ZipPath -DestinationPath $TempDir -Force
        $Extracted = Get-ChildItem -Path $TempDir | Where-Object { $_.PSIsContainer } | Select-Object -First 1
        if ($Extracted) {
            # Handle nested directory structure (like adoptium JDKs)
            $NestedDirs = Get-ChildItem -Path $Extracted.FullName | Where-Object { $_.PSIsContainer }
            if ($NestedDirs) {
                Copy-Item "$($NestedDirs[0].FullName)\*" "release\RaceCoordinator\$DestSubDir\" -Recurse -Force
            } else {
                Copy-Item "$($Extracted.FullName)\*" "release\RaceCoordinator\$DestSubDir\" -Recurse -Force
            }
        }
        Remove-Item $TempDir -Recurse -Force
    }
}

Extract-To-Release "java8.zip" "jre8" "bundled_jre8.zip"
Extract-To-Release "java17.zip" "jre17" "bundled_jre17.zip"
Extract-To-Release "mongodb32.zip" "mongodb32" $null
Extract-To-Release "mongodb44.zip" "mongodb44" $null

# 5. Create Launch Scripts
function Create-Scripts {
    param($TargetDir)
    $Dest = Join-Path $PSScriptRoot $TargetDir
    
    # Mac Launch Script (Comprehensive)
    $MacScript = @'
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
'@
    $MacScript | Out-File -FilePath "$Dest\start_mac.command" -Encoding ascii

    # Linux / RPi Launch Script
    $LinuxScript = @'
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
'@
    $LinuxScript | Out-File -FilePath "$Dest\start_linux_rpi.sh" -Encoding ascii

    # Windows Launch Script
    $WinScript = @'
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
'@
    $WinScript | Out-File -FilePath "$Dest\start_win.bat" -Encoding ascii

    # Windows Setup Script
    $SetupScript = @'
@echo off
pushd "%~dp0"
echo Running Race Coordinator Setup...
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0install_dependencies.ps1'"
pause
popd
'@
    $SetupScript | Out-File -FilePath "$Dest\setup_windows.bat" -Encoding ascii

    # PowerShell Dependency Installer (Updated for Offline support)
    $PSInstaller = @'
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
'@
    $PSInstaller | Out-File -FilePath "$Dest\install_dependencies.ps1" -Encoding ascii

    # Create README
    $Readme = @'
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
'@
    $Readme | Out-File -FilePath "$Dest\README.txt" -Encoding ascii
    
    # Set executable permissions for Unix scripts
    if (Get-Command chmod -ErrorAction SilentlyContinue) {
        Exec { chmod +x "$Dest\start_mac.command" }
        Exec { chmod +x "$Dest\start_linux_rpi.sh" }
    }
}

Write-Host "Generating scripts for standard distribution..." -ForegroundColor Gray
Create-Scripts "release\RaceCoordinator"
Write-Host "Generating scripts for offline distribution..." -ForegroundColor Gray
Create-Scripts "release\RaceCoordinator_Offline"

# 6. Create Zip packages
Write-Host "Creating Zip packages..." -ForegroundColor Yellow
Compress-Archive -Path "release\RaceCoordinator\*" -DestinationPath "release\RaceCoordinator_Universal.zip" -Force
Compress-Archive -Path "release\RaceCoordinator_Offline\*" -DestinationPath "release\RaceCoordinator_Windows_Offline.zip" -Force

# 7. Create Windows Installer (.exe) with Inno Setup
$ISCC = "${env:ProgramFiles(x86)}\Inno Setup 6\iscc.exe"
if (Get-Command iscc -ErrorAction SilentlyContinue) {
    Write-Host "Creating Windows Installer (.exe) using Inno Setup..." -ForegroundColor Cyan
    Exec { iscc installer.iss }
    Exec { iscc installer_offline.iss }
    Exec { iscc installer_offline_legacy.iss }
} elseif (Test-Path $ISCC) {
    Write-Host "Creating Windows Installer (.exe) using Inno Setup (found in default path)..." -ForegroundColor Cyan
    Exec { & $ISCC installer.iss }
    Exec { & $ISCC installer_offline.iss }
    Exec { & $ISCC installer_offline_legacy.iss }
} else {
    Write-Warning "Inno Setup (iscc) not found. Skipping .exe installer creation."
    Write-Host "To build the .exe installer, install Inno Setup and run: iscc installer.iss, installer_offline.iss, etc."
}

Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "Artifacts in 'release/' directory."
