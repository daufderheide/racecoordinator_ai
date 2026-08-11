param(
    [switch]$Headless
)
$ErrorActionPreference = "Stop"

# Parse dynamic ports
$ServerPort = 7070
$ClientPort = 4200

for ($i = 0; $i -lt $args.Count; $i++) {
    if ($args[$i] -eq "--port" -and ($i + 1) -lt $args.Count) { $ServerPort = [int]$args[$i+1] }
    elseif ($args[$i] -like "--port=*") { $ServerPort = [int]($args[$i] -replace "--port=", "") }
}

if ($env:SERVER_PORT) { $ServerPort = [int]$env:SERVER_PORT }

function Test-PortInUse($Port) {
    $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    return ($null -ne $conn)
}

function Stop-PortProcesses($Port) {
    if (Test-PortInUse $Port) {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $pidToKill = $conn.OwningProcess
            if ($pidToKill -gt 0) {
                try {
                    Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                } catch {}
            }
        }
    }
}

function Show-PortErrorDialog($Title, $Message) {
    Write-Host "PORT CONFLICT ERROR - $Title: $Message" -ForegroundColor Red
    try {
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show($Message, $Title, [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
    } catch {}
}

if (-not $Headless -and (Test-PortInUse $ClientPort)) {
    Show-PortErrorDialog "Race Coordinator AI - Client Port Conflict" "Failed to start Angular Client on port $ClientPort.`nPort $ClientPort is already in use by another process.`n`nPlease terminate the process using port $ClientPort and try again."
    exit 1
}

if (Test-PortInUse $ServerPort) {
    Show-PortErrorDialog "Race Coordinator AI - Web Server Port Conflict" "Failed to start Web Server on port $ServerPort.`nPort $ServerPort is already in use by another process.`n`nPlease terminate the process using port $ServerPort or launch with '--port <port'."
    exit 1
}

if (-not $Headless) {
    Write-Host "Starting Angular Client..." -ForegroundColor Cyan
    $ClientProcess = Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSScriptRoot\run_client.ps1`" -Open" -PassThru
    Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
        if ($ClientProcess -and -not $ClientProcess.HasExited) {
            Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.ParentProcessId -eq $ClientProcess.Id } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
            Stop-Process -Id $ClientProcess.Id -Force -ErrorAction SilentlyContinue
        }
        Stop-PortProcesses $ClientPort
        Stop-PortProcesses $ServerPort
    } | Out-Null
}

# Setup Java Environment
$HasValidJdk = $false
if (-not [string]::IsNullOrEmpty($env:JAVA_HOME)) {
    if (Test-Path "$env:JAVA_HOME\bin\javac.exe") {
        $HasValidJdk = $true
    }
}

if (-not $HasValidJdk) {
    $CommonJavaPaths = @(
        "C:\Program Files\Java\jdk*",
        "C:\Program Files\Eclipse Adoptium\jdk*",
        "C:\Program Files\Eclipse Adoptium\temurin-*",
        "C:\Program Files\Amazon Corretto\jdk*",
        "C:\Program Files\Microsoft\jdk*",
        "C:\Program Files\Android\openjdk\jdk*"
    )
    $FoundJdk = Get-Item $CommonJavaPaths -ErrorAction SilentlyContinue | Where-Object { Test-Path "$_\bin\javac.exe" } | Sort-Object Name -Descending | Select-Object -First 1
    
    if ($FoundJdk) {
        $env:JAVA_HOME = $FoundJdk.FullName
        Write-Host "Dynamically set JAVA_HOME to JDK: $env:JAVA_HOME" -ForegroundColor Green
    } else {
        $JavacCmd = Get-Command javac.exe -ErrorAction SilentlyContinue
        if ($JavacCmd) {
            $env:JAVA_HOME = (Get-Item $JavacCmd.Source).Directory.Parent.FullName
            Write-Host "Dynamically set JAVA_HOME to JDK based on PATH: $env:JAVA_HOME" -ForegroundColor Green
        } else {
            $JavaCmd = Get-Command java.exe -ErrorAction SilentlyContinue
            if ($JavaCmd) {
                $env:JAVA_HOME = (Get-Item $JavaCmd.Source).Directory.Parent.FullName
                Write-Host "Dynamically set JAVA_HOME to JRE based on PATH: $env:JAVA_HOME" -ForegroundColor Green
            } else {
                Write-Warning "Could not dynamically find a JDK. Ensure JAVA_HOME is set."
            }
        }
    }
}

if (-not [string]::IsNullOrEmpty($env:JAVA_HOME)) {
    $env:Path = "$env:JAVA_HOME\bin;" + $env:Path
}
$SERVER_DIR = "$PSScriptRoot\server"
$BUILD_DIR = "target_generated"

# Ensure Maven is available (system, common locations, or local tools folder)
$MvnCmd = Get-Command mvn.cmd -ErrorAction SilentlyContinue
if ($null -eq $MvnCmd) {
    $CommonPaths = @(
        "C:\Maven\apache-maven-*\bin\mvn.cmd",
        "C:\Program Files\apache-maven-*\bin\mvn.cmd",
        "C:\maven\bin\mvn.cmd"
    )
    $MvnCmd = Get-Item $CommonPaths -ErrorAction SilentlyContinue | Select-Object -First 1
}

$LocalMavenBin = Join-Path $PSScriptRoot "tools\maven\bin"
if ($null -eq $MvnCmd) {
    if (-not (Test-Path $LocalMavenBin)) {
        Write-Host "Maven not found on system PATH or common locations." -ForegroundColor Yellow
        Write-Host "Downloading Apache Maven 3.9.6..." -ForegroundColor Cyan
        $ToolsDir = Join-Path $PSScriptRoot "tools"
        if (-not (Test-Path $ToolsDir)) {
            New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null
        }
        $ZipPath = Join-Path $ToolsDir "maven.zip"
        $MavenUrl = "https://archive.apache.org/dist/maven/maven-3/3.9.6/binaries/apache-maven-3.9.6-bin.zip"
        
        # Download Maven
        Invoke-WebRequest -Uri $MavenUrl -OutFile $ZipPath
        
        # Extract Maven
        Write-Host "Extracting Maven..." -ForegroundColor Cyan
        Expand-Archive -Path $ZipPath -DestinationPath $ToolsDir -Force
        
        # Rename extracted folder to 'maven'
        $ExtractedFolder = Join-Path $ToolsDir "apache-maven-3.9.6"
        $TargetFolder = Join-Path $ToolsDir "maven"
        if (Test-Path $TargetFolder) {
            Remove-Item -Recurse -Force $TargetFolder | Out-Null
        }
        Rename-Item -Path $ExtractedFolder -NewName "maven"
        Remove-Item -Force $ZipPath | Out-Null
        Write-Host "Maven set up successfully in $TargetFolder" -ForegroundColor Green
    }
}

# Add local maven to PATH if it exists (either pre-existing or downloaded)
if (Test-Path $LocalMavenBin) {
    $env:Path = "$LocalMavenBin;" + $env:Path
}

# Run generate_protos.ps1 to handle protobuf generation (like generate_protos.sh on Unix)
# Tell it to use the same output directory as this headless build
Write-Host "Generating Protobuf files..." -ForegroundColor Cyan
Set-Location $SERVER_DIR
$env:PROTO_DEST_DIR = Join-Path $SERVER_DIR $BUILD_DIR
. .\generate_protos.ps1 --server-only

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

if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64" -or $env:PROCESSOR_ARCHITEW6432 -eq "ARM64") {
    $env:MAVEN_OPTS = "-Djava.library.path=$(Join-Path $SERVER_DIR 'lib\windows\arm64')"
} elseif ([Environment]::Is64BitProcess) {
    $env:MAVEN_OPTS = "-Djava.library.path=$(Join-Path $SERVER_DIR 'lib\windows\x64')"
} else {
    $env:MAVEN_OPTS = "-Djava.library.path=$(Join-Path $SERVER_DIR 'lib\windows\x86')"
}

# Use BUILD_DIR for both proto generation and maven build to avoid conflicts
$MvnArgs = @("compile", "exec:java", "-Dbuild.dist.dir=$BUILD_DIR", "-Dexec.mainClass=com.antigravity.App", "-Dexec.args=--headless", "-Dapp.data.dir=$DATA_DIR", "-DskipProtobuf=true")
if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64" -or $env:PROCESSOR_ARCHITEW6432 -eq "ARM64") {
    $MvnArgs += '-Dde.flapdoodle.os.override="Windows|X86_64||"'
}
& $MvnExecutable @MvnArgs
