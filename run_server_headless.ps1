$ErrorActionPreference = "Stop"

# Setup Java Environment
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

$SERVER_DIR = "$PSScriptRoot\server"
$PROTO_ROOT = "$PSScriptRoot\proto"
# Use a separate target directory for headless to avoid locking issues with dev
$JAVA_OUT = "$SERVER_DIR\target_generated\generated-sources\protobuf\java"

# Ensure output directory exists
if (-not (Test-Path $JAVA_OUT)) {
    New-Item -ItemType Directory -Path $JAVA_OUT -Force | Out-Null
}

# Find protoc in .m2 repository
$M2Repo = Join-Path $env:USERPROFILE ".m2\repository"
$ProtocExe = Get-ChildItem -Path "$M2Repo\com\google\protobuf\protoc" -Recurse -Filter "protoc-*.exe" | Select-Object -First 1 -ExpandProperty FullName

if ($null -eq $ProtocExe) {
    Write-Host "Protoc not found in .m2. Attempting to download via maven..." -ForegroundColor Yellow
    Set-Location $SERVER_DIR
    mvn protobuf:compile
    $ProtocExe = Get-ChildItem -Path "$M2Repo\com\google\protobuf\protoc" -Recurse -Filter "protoc-*.exe" | Select-Object -First 1 -ExpandProperty FullName
}

if ($null -eq $ProtocExe) {
    throw "Protoc could not be found or downloaded."
}

Write-Host "Generating Protobuf files using $ProtocExe..." -ForegroundColor Cyan
Push-Location $PROTO_ROOT
$RelativeFiles = Get-ChildItem -Recurse -Filter "*.proto" | Resolve-Path -Relative
& $ProtocExe --proto_path=. --java_out="$JAVA_OUT" $RelativeFiles
Pop-Location

Write-Host "Starting Headless Server..." -ForegroundColor Green
Set-Location $SERVER_DIR

# Find mvn.cmd
$MvnCmd = Get-Command mvn.cmd -ErrorAction SilentlyContinue
if ($null -eq $MvnCmd) {
    $CommonPaths = @(
        "C:\Maven\apache-maven-*\bin\mvn.cmd",
        "C:\Program Files\apache-maven-*\bin\mvn.cmd",
        "C:\maven\bin\mvn.cmd"
    )
    $MvnCmd = Get-Item $CommonPaths -ErrorAction SilentlyContinue | Select-Object -First 1
}

if ($null -eq $MvnCmd) {
    Write-Warning "mvn.cmd not found in PATH or common locations. Falling back to 'mvn'."
    $MvnExecutable = "mvn"
} else {
    $MvnExecutable = "mvn.cmd"
}

$DATA_DIR = Join-Path $PSScriptRoot "data"
# -Dbuild.dist.dir=target_generated ensures we don't conflict with normal target_test
$MvnArgs = @("compile", "exec:java", "-Dbuild.dist.dir=target_generated", "-Dexec.mainClass=com.antigravity.App", "-Dexec.args=--headless", "-Dapp.data.dir=$DATA_DIR")
& $MvnExecutable @MvnArgs
