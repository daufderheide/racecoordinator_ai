param(
    [switch]$Headless,
    [string]$ReplayLog
)
$ErrorActionPreference = "Stop"

# Parse dynamic ports and replay log
$ServerPort = 7070
$ClientPort = 4200

for ($i = 0; $i -lt $args.Count; $i++) {
    if ($args[$i] -eq "--port" -and ($i + 1) -lt $args.Count) { $ServerPort = [int]$args[$i+1] }
    elseif ($args[$i] -like "--port=*") { $ServerPort = [int]($args[$i] -replace "--port=", "") }
    elseif (($args[$i] -eq "--replay" -or $args[$i] -eq "-r") -and ($i + 1) -lt $args.Count) { $ReplayLog = $args[$i+1] }
    elseif ($args[$i] -like "--replay=*") { $ReplayLog = ($args[$i] -replace "--replay=", "") }
}

if ($env:SERVER_PORT) { $ServerPort = [int]$env:SERVER_PORT }
if ($env:REPLAY_LOG) { $ReplayLog = $env:REPLAY_LOG }
if (-not [string]::IsNullOrEmpty($ReplayLog) -and -not [System.IO.Path]::IsPathRooted($ReplayLog)) {
    $ReplayLog = Join-Path $PSScriptRoot $ReplayLog
}

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

function Get-PortConflictReport($Port, $ServiceName) {
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if (-not $connections) {
        $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    }

    $owningPid = $null
    if ($connections) {
        $owningPid = ($connections | Select-Object -ExpandProperty OwningProcess -First 1)
    }

    if ($owningPid -and $owningPid -gt 0) {
        $proc = Get-CimInstance Win32_Process -Filter "ProcessId = $owningPid" -ErrorAction SilentlyContinue
        if (-not $proc) {
            $proc = Get-WmiObject Win32_Process -Filter "ProcessId = $owningPid" -ErrorAction SilentlyContinue
        }

        $procName = if ($proc) { $proc.Name } else { (Get-Process -Id $owningPid -ErrorAction SilentlyContinue).Name }
        $cmdLine = if ($proc) { $proc.CommandLine } else { $null }
        $execPath = if ($proc) { $proc.ExecutablePath } else { (Get-Process -Id $owningPid -ErrorAction SilentlyContinue).Path }

        $appDesc = $null
        if ($cmdLine) {
            $lowerCmd = $cmdLine.ToLower()
            if ($lowerCmd -match "racecoordinator|com\.antigravity\.app|com\.antigravity\.") {
                if ($lowerCmd -match "app|server") {
                    $appDesc = "Race Coordinator AI Server (another instance is already running)"
                } elseif ($lowerCmd -match "ng|client") {
                    $appDesc = "Race Coordinator AI Client (Angular dev server)"
                } else {
                    $appDesc = "Race Coordinator AI (another instance is already running)"
                }
            } elseif ($lowerCmd -match "ng(\.cmd|\.ps1|\.js)?[ ]+serve|@angular/cli") {
                $appDesc = "Angular Dev Server"
            } elseif ($procName -match "^java(w)?(\.exe)?$" -and $cmdLine -match "-jar\s+[""']?([^""'\s]+\.jar)[""']?") {
                $jarName = Split-Path -Leaf $Matches[1]
                $appDesc = "Java Application ($jarName)"
            } elseif ($procName -match "^java(w)?(\.exe)?$") {
                $appDesc = "Java Application"
            } elseif ($procName -match "^node(\.exe)?$") {
                $appDesc = "Node.js Application"
            }
        } elseif ($procName -match "^java(w)?(\.exe)?$") {
            $appDesc = "Java Application"
        }

        $lines = @("Failed to start $ServiceName on port $Port.", "", "Port $Port is currently in use by another application:")
        if ($appDesc) {
            $lines += "  • Application: $appDesc"
        }
        if ($procName) {
            $lines += "  • Process: $procName (PID: $owningPid)"
        } else {
            $lines += "  • PID: $owningPid"
        }
        if ($execPath) {
            $lines += "  • Path: $execPath"
        }
        if ($cmdLine) {
            $shortCmd = $cmdLine.Trim()
            if ($shortCmd.Length -gt 140) {
                $shortCmd = $shortCmd.Substring(0, 140) + "..."
            }
            $lines += "  • Command: $shortCmd"
        }

        $lines += ""
        $lines += "Troubleshooting Steps:"
        $lines += "1. Close or terminate the conflicting application (PID: $owningPid)."
        if ($appDesc -and $appDesc -match "Race Coordinator AI") {
            $lines += "   Another instance of Race Coordinator AI appears to already be running."
        }
        if ($ServiceName -eq "Web Server") {
            $lines += "2. Or launch with '--port <port>' (or set SERVER_PORT / PORT environment variable)."
        } else {
            $lines += "2. Or start in headless mode with '-Headless' if you only need the server."
        }
        return ($lines -join "`n")
    }

    # Check for Windows excluded port range (WinNAT / Hyper-V / WSL2)
    $excludedRange = $null
    $netshOut = netsh interface ipv4 show excludedportrange protocol=tcp 2>$null
    if ($netshOut) {
        foreach ($line in $netshOut) {
            if ($line -match '^\s*(\d+)\s+(\d+)') {
                $startP = [int]$Matches[1]
                $endP = [int]$Matches[2]
                if ($Port -ge $startP -and $Port -le $endP) {
                    $excludedRange = "$startP - $endP"
                    break
                }
            }
        }
    }
    if (-not $excludedRange) {
        $netshIpv6 = netsh interface ipv6 show excludedportrange protocol=tcp 2>$null
        if ($netshIpv6) {
            foreach ($line in $netshIpv6) {
                if ($line -match '^\s*(\d+)\s+(\d+)') {
                    $startP = [int]$Matches[1]
                    $endP = [int]$Matches[2]
                    if ($Port -ge $startP -and $Port -le $endP) {
                        $excludedRange = "$startP - $endP"
                        break
                    }
                }
            }
        }
    }

    if ($excludedRange) {
        $lines = @(
            "Failed to start $ServiceName on port $Port.", "",
            "Port $Port falls within a Windows excluded port range ($excludedRange).",
            "This is caused by Windows dynamic port reservations (WinNAT / Hyper-V / WSL2).",
            "No application is listening on port $Port, but Windows has reserved it.", "",
            "Troubleshooting Steps:",
            "1. Restart the Windows NAT service from an Administrator Command Prompt:",
            "     net stop winnat",
            "     net start winnat",
            "2. Or restart your computer.",
            "3. Or launch with '--port <port>' (or set SERVER_PORT / PORT environment variable)."
        )
        return ($lines -join "`n")
    }

    $lines = @(
        "Failed to start $ServiceName on port $Port.", "",
        "Port $Port is already in use by another process or unavailable.", "",
        "Troubleshooting Steps:",
        "1. Terminate the process using port $Port, or restart your computer."
    )
    if ($ServiceName -eq "Web Server") {
        $lines += "2. Or launch with '--port <port>' (or set SERVER_PORT / PORT environment variable)."
    } else {
        $lines += "2. Or start in headless mode with '-Headless' if you only need the server."
    }
    return ($lines -join "`n")
}

function Show-PortErrorDialog($Title, $Message) {
    Write-Host "`nPORT CONFLICT ERROR - $Title:" -ForegroundColor Red
    Write-Host "$Message`n" -ForegroundColor Yellow
    try {
        Add-Type -AssemblyName System.Windows.Forms
        [System.Windows.Forms.MessageBox]::Show($Message, $Title, [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
    } catch {}
}

if (-not $Headless -and (Test-PortInUse $ClientPort)) {
    $report = Get-PortConflictReport $ClientPort "Angular Client"
    Show-PortErrorDialog "Race Coordinator AI - Client Port Conflict" $report
    exit 1
}

if (Test-PortInUse $ServerPort) {
    $report = Get-PortConflictReport $ServerPort "Web Server"
    Show-PortErrorDialog "Race Coordinator AI - Web Server Port Conflict" $report
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

$NativeLibOpt = "-Djava.library.path=$(Join-Path $SERVER_DIR 'lib\windows\x64')"
if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64" -or $env:PROCESSOR_ARCHITEW6432 -eq "ARM64") {
    $NativeLibOpt = "-Djava.library.path=$(Join-Path $SERVER_DIR 'lib\windows\arm64')"
} elseif (-not [Environment]::Is64BitProcess) {
    $NativeLibOpt = "-Djava.library.path=$(Join-Path $SERVER_DIR 'lib\windows\x86')"
}
$env:MAVEN_OPTS = "$NativeLibOpt $env:MAVEN_OPTS".Trim()

# Use BUILD_DIR for both proto generation and maven build to avoid conflicts
$MvnArgs = @("compile", "exec:java", "-Dbuild.dist.dir=$BUILD_DIR", "-Dexec.mainClass=com.antigravity.App", "-Dexec.args=--headless", "-Dapp.data.dir=$DATA_DIR", "-DskipProtobuf=true")
if (-not [string]::IsNullOrEmpty($ReplayLog)) {
    $MvnArgs += "-DenableLogReplay=$ReplayLog"
}
if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64" -or $env:PROCESSOR_ARCHITEW6432 -eq "ARM64") {
    $MvnArgs += '-Dde.flapdoodle.os.override="Windows|X86_64||"'
}
& $MvnExecutable @MvnArgs
