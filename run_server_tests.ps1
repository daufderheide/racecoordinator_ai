$ErrorActionPreference = "Stop"

# Configuration
$ProjectRoot = if ($PSScriptRoot) { $PSScriptRoot } elseif ($MyInvocation.MyCommand.Definition) { Split-Path -Parent $MyInvocation.MyCommand.Definition } else { $PWD.Path }
$ServerDir = Join-Path $ProjectRoot "server"

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

$LocalMavenBin = Join-Path $ProjectRoot "tools\maven\bin"
if ($null -eq $MvnCmd) {
    if (-not (Test-Path $LocalMavenBin)) {
        Write-Host "Maven not found on system PATH or common locations." -ForegroundColor Yellow
        Write-Host "Downloading Apache Maven 3.9.6..." -ForegroundColor Cyan
        $ToolsDir = Join-Path $ProjectRoot "tools"
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
$ServerTmp = Join-Path $ServerDir "target_tmp"
$ServerBuildDir = Join-Path $ServerTmp "target_test"
$env:PROTO_DEST_DIR = $ServerBuildDir

Write-Host ""
Write-Host "--- 🔹 Running Server Tests (PowerShell) 🔹 ---" -ForegroundColor Cyan

if (-not (Test-Path $ServerTmp)) {
    New-Item -ItemType Directory -Path $ServerTmp -Force | Out-Null
}

# Pre-create all directories maven needs to avoid EPERM errors
$DirsToCreate = @(
    (Join-Path $ServerBuildDir "generated-sources\protobuf\java")
    (Join-Path $ServerBuildDir "classes")
    (Join-Path $ServerBuildDir "test-classes")
)

foreach ($dir in $DirsToCreate) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

Set-Location $ServerDir

# 1. Generate protobufs
Write-Host "Generating Protobufs..." -ForegroundColor Gray
. .\generate_protos.ps1 --server-only

# 2. Run tests
Write-Host "Executing Maven tests..." -ForegroundColor Green

# Simple fork count for Windows
$ForkCount = "1"
$ReuseForks = "true"

$env:npm_config_cache = Join-Path $ServerTmp "npm_cache"
$env:EMBEDDED_MONGO_ARTIFACTS = Join-Path $ServerTmp ".embedmongo"

# Ensure all temp directories are on the same drive to avoid cross-drive file move issues
$env:TEMP = $ServerTmp
$env:TMP = $ServerTmp

# JVM optimization for faster startup in tests
$env:MAVEN_OPTS = "-XX:TieredStopAtLevel=1 -Djdk.attach.allowAttachSelf=true -Dnet.bytebuddy.experimental=true --add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.lang.reflect=ALL-UNNAMED --add-opens java.base/java.io=ALL-UNNAMED --add-opens java.base/java.util=ALL-UNNAMED"

$MvnArgs = @("test") + $args + @(
    "-Dbuild.dist.dir=$ServerBuildDir"
    "-DskipProtobuf=true"
    "-DforkCount=$ForkCount"
    "-DreuseForks=$ReuseForks"
    "-Djava.io.tmpdir=$ServerTmp"
    "-Dde.flapdoodle.embed.mongo.artifacts=$ServerTmp\.embedmongo"
    "-Dmaven.repo.local=$ServerDir\.m2\repository"
    "-DargLine=-Dnet.bytebuddy.experimental=true"
)
if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64" -or $env:PROCESSOR_ARCHITEW6432 -eq "ARM64") {
    $MvnArgs += '-Dde.flapdoodle.os.override="Windows|X86_64||"'
}

# Find mvn.cmd
$MvnCmd = Get-Command mvn.cmd -ErrorAction SilentlyContinue
if ($null -eq $MvnCmd) {
    $MvnExecutable = "mvn"
} else {
    $MvnExecutable = "mvn.cmd"
}

& $MvnExecutable @MvnArgs
