$ErrorActionPreference = "Stop"

# Setup Java Environment
if ([string]::IsNullOrEmpty($env:JAVA_HOME) -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    $CommonJavaPaths = @(
        "C:\Program Files\Java\jdk*",
        "C:\Program Files\Eclipse Adoptium\jdk*",
        "C:\Program Files\Amazon Corretto\jdk*",
        "C:\Program Files\Microsoft\jdk*"
    )
    $FoundJdk = Get-Item $CommonJavaPaths -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
    
    if ($FoundJdk) {
        $env:JAVA_HOME = $FoundJdk.FullName
        Write-Host "Dynamically set JAVA_HOME to $env:JAVA_HOME" -ForegroundColor Green
    } else {
        $JavaCmd = Get-Command java.exe -ErrorAction SilentlyContinue
        if ($JavaCmd) {
            $env:JAVA_HOME = (Get-Item $JavaCmd.Source).Directory.Parent.FullName
            Write-Host "Dynamically set JAVA_HOME to $env:JAVA_HOME based on PATH" -ForegroundColor Green
        } else {
            Write-Warning "Could not dynamically find a JDK. Ensure JAVA_HOME is set."
        }
    }
}

if (-not [string]::IsNullOrEmpty($env:JAVA_HOME)) {
    $env:Path = "$env:JAVA_HOME\bin;" + $env:Path
}
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
