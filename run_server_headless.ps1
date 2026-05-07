$ErrorActionPreference = "Stop"

# Setup Java Environment
$PotentialJavaHome = "$PSScriptRoot\tools\jdk\jdk-21.0.3+9"
if (Test-Path $PotentialJavaHome) {
    $env:JAVA_HOME = $PotentialJavaHome
    $env:Path = "$env:JAVA_HOME\bin;" + $env:Path
}

$SERVER_DIR = "$PSScriptRoot\server"
$BUILD_DIR = "target_generated"

# Run generate_protos.ps1 to handle protobuf generation (like generate_protos.sh on Unix)
# Tell it to use the same output directory as this headless build
Write-Host "Generating Protobuf files..." -ForegroundColor Cyan
Set-Location $SERVER_DIR
$env:PROTO_DEST_DIR = Join-Path $SERVER_DIR $BUILD_DIR
& powershell -ExecutionPolicy Bypass -File generate_protos.ps1

Write-Host "Starting Headless Server..." -ForegroundColor Green
Set-Location $SERVER_DIR

# Find mvn.cmd
$MvnCmd = Get-Command mvn.cmd -ErrorAction SilentlyContinue
if ($null -eq $MvnCmd) {
    # Try common installation paths if not in PATH
    $CommonPaths = @(
        "$PSScriptRoot\tools\maven\apache-maven-*\bin\mvn.cmd",
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
    if ($MvnCmd -is [System.IO.FileInfo]) {
        $MvnExecutable = $MvnCmd.FullName
    } else {
        $MvnExecutable = "mvn.cmd"
    }
}

$DATA_DIR = Join-Path $PSScriptRoot "data"
# Use BUILD_DIR for both proto generation and maven build to avoid conflicts
$MvnArgs = @("compile", "exec:java", "-Dbuild.dist.dir=$BUILD_DIR", "-Dexec.mainClass=com.antigravity.App", "-Dexec.args=--headless", "-Dapp.data.dir=$DATA_DIR")
& $MvnExecutable @MvnArgs
