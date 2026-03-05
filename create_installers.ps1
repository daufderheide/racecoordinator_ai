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
if (-not (Test-Path "$PSScriptRoot\client\dist\client\index.html")) {
    Write-Host "Building Client..." -ForegroundColor Yellow
    Set-Location "$PSScriptRoot\client"
    Exec { npm install }
    Exec { npm run build }
    Set-Location "$PSScriptRoot"
} else {
    Write-Host "Client artifacts found. Skipping client build. (Delete 'client/dist' to force rebuild)" -ForegroundColor Gray
}

# 2. Clean and Build Server
Write-Host "Building Server..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot\server"

Write-Host "Cleaning and Packaging Server..."
Exec { mvn clean "-Dbuild.dist.dir=target_dist" }

# Ensure Proto Gen works correctly (Cross-platform fix)
# Maven expects sources in target_dist/generated-sources/protobuf/java
$GenSrcDir = "$PSScriptRoot\server\target_dist\generated-sources\protobuf\java"
if (Test-Path $GenSrcDir) {
    Remove-Item -Path "$GenSrcDir\*" -Recurse -Force
} else {
    New-Item -ItemType Directory -Path $GenSrcDir -Force
}

$M2Repo = Join-Path $env:USERPROFILE ".m2\repository"
$ProtocExe = Get-ChildItem -Path "$M2Repo\com\google\protobuf\protoc" -Recurse -Filter "protoc-*.exe" | Select-Object -First 1 -ExpandProperty FullName

Write-Host "Manually generating Java Protobuf sources..." -ForegroundColor Gray
$ProtoSrcDir = "$PSScriptRoot\proto"
$AllProtoFiles = Get-ChildItem -Path $ProtoSrcDir -Recurse -Filter "*.proto" | Select-Object -ExpandProperty FullName
Exec { & $ProtocExe --proto_path="$ProtoSrcDir" --java_out="$GenSrcDir" $AllProtoFiles }

Exec { mvn package "-Dmaven.test.skip=true" "-Dbuild.dist.dir=target_dist" }
Set-Location "$PSScriptRoot"

# 3. Download Dependencies for Offline Installer
Write-Host "Downloading Dependencies for Offline Installer..." -ForegroundColor Yellow
if (-not (Test-Path "build_cache")) { New-Item -ItemType Directory -Path "build_cache" }

$Deps = @{
    "java8.zip"     = "https://api.adoptium.net/v3/binary/latest/8/ga/windows/x86/jdk/hotspot/normal/eclipse?project=jdk"
    "java17.zip"    = "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk"
    "mongodb32.zip" = "https://fastdl.mongodb.org/win32/mongodb-win32-i386-3.2.22.zip"
    "mongodb44.zip" = "https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-4.4.26.zip"
}

foreach ($item in $Deps.GetEnumerator()) {
    $path = Join-Path "build_cache" $item.Key
    if (-not (Test-Path $path) -or (Get-Item $path).Length -eq 0) {
        Write-Host "Downloading $($item.Key)..."
        Invoke-WebRequest -Uri $item.Value -OutFile $path
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
copy $JarFile "release\RaceCoordinator\RaceCoordinator.jar"
copy $JarFile "release\RaceCoordinator_Offline\RaceCoordinator.jar"
Copy-Item "client\dist\client\*" "release\RaceCoordinator\web\" -Recurse
Copy-Item "client\dist\client\*" "release\RaceCoordinator_Offline\web\" -Recurse

# Extract and Bundle Dependencies
function Extract-To-Release {
    param($ZipName, $DestSubDir, $BundleName)
    $ZipPath = Join-Path "build_cache" $ZipName
    if (Test-Path $ZipPath) {
        if ($BundleName) {
            copy $ZipPath "release\RaceCoordinator_Offline\$BundleName"
        }
        Write-Host "Extracting $ZipName..." -ForegroundColor Cyan
        $TempDir = Join-Path "release\RaceCoordinator" "temp_$($ZipName.BaseName)"
        Expand-Archive -Path $ZipPath -DestinationPath $TempDir -Force
        $Extracted = Get-ChildItem -Path $TempDir | Where-Object { $_.PSIsContainer } | Select-Object -First 1
        Copy-Item "$($Extracted.FullName)\*" "release\RaceCoordinator\$DestSubDir\" -Recurse
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
    
    # Windows Launch
    @'
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
'@ | Out-File -FilePath "$Dest\start_win.bat" -Encoding ascii

    # Windows Setup
    @'
@echo off
pushd "%~dp0"
echo Running Race Coordinator Setup...
PowerShell -NoProfile -ExecutionPolicy Bypass -Command "& '%~dp0install_dependencies.ps1'"
pause
popd
'@ | Out-File -FilePath "$Dest\setup_windows.bat" -Encoding ascii

    # Mac/Linux (Simplified for parity)
    @'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"
java -jar RaceCoordinator.jar "$@"
'@ | Out-File -FilePath "$Dest\start_mac.command" -Encoding ascii

    @'
#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"
java -jar RaceCoordinator.jar "$@"
'@ | Out-File -FilePath "$Dest\start_linux_rpi.sh" -Encoding ascii

    "Race Coordinator Release Bundle" | Out-File -FilePath "$Dest\README.txt" -Encoding ascii
}

Create-Scripts "release\RaceCoordinator"
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
}

Write-Host "Build Complete!" -ForegroundColor Green
Write-Host "Artifacts in 'release/' directory."
