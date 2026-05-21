$ErrorActionPreference = "Stop"

# Setup Java Environment
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.10.7-hotspot"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

$SERVER_DIR = "$PSScriptRoot\server"

# Run generate_protos.ps1 to handle protobuf generation (like generate_protos.sh on Unix)
# Use --server-only to avoid regenerating client protobuf files which can cause compatibility issues
Write-Host "Generating Protobuf files..." -ForegroundColor Cyan
Set-Location $SERVER_DIR
& powershell -ExecutionPolicy Bypass -File generate_protos.ps1 --server-only

Write-Host "Starting Server..." -ForegroundColor Green
Set-Location $SERVER_DIR

# Find mvn.cmd
$MvnCmd = Get-Command mvn.cmd -ErrorAction SilentlyContinue
if ($null -eq $MvnCmd) {
    # Try common installation paths if not in PATH
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
$MvnArgs = @("clean", "compile", "exec:java", "-Dexec.mainClass=com.antigravity.App", "-Dapp.data.dir=$DATA_DIR", "-DskipProtobuf=false")
& $MvnExecutable @MvnArgs
