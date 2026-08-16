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

# Ensure Maven is available
$LocalMavenBin = Join-Path $ProjectRoot "tools\maven\bin"
if (Test-Path $LocalMavenBin) {
    $env:Path = "$LocalMavenBin;" + $env:Path
}

$ServerTmp = Join-Path $ServerDir "target_tmp"
$ServerBuildDir = Join-Path $ServerTmp "target_test"
$env:PROTO_DEST_DIR = $ServerBuildDir

Write-Host ""
Write-Host "--- Running Server Mutation Tests (PowerShell) ---" -ForegroundColor Cyan

if (-not (Test-Path $ServerTmp)) {
    New-Item -ItemType Directory -Path $ServerTmp -Force | Out-Null
}

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

# Parse arguments
$TargetClasses = ""
$TargetTests = ""
$MutationThreshold = "0"
$ExtraArgs = @()

foreach ($arg in $args) {
    if ($arg.StartsWith("--target=")) {
        $target = $arg.Substring(9)
        $TargetClasses = $target
        $TargetTests = "${target}Test"
    } elseif ($arg.StartsWith("--target-classes=")) {
        $TargetClasses = $arg.Substring(17)
    } elseif ($arg.StartsWith("--target-tests=")) {
        $TargetTests = $arg.Substring(15)
    } elseif ($arg.StartsWith("--threshold=")) {
        $MutationThreshold = $arg.Substring(12)
    } else {
        $ExtraArgs += $arg
    }
}

$PitestArgs = @()
if (-not [string]::IsNullOrEmpty($TargetClasses)) {
    $PitestArgs += "-DtargetClasses=$TargetClasses"
}
if (-not [string]::IsNullOrEmpty($TargetTests)) {
    $PitestArgs += "-DtargetTests=$TargetTests"
}
if ($MutationThreshold -ne "0") {
    $PitestArgs += "-DmutationThreshold=$MutationThreshold"
}

$env:TEMP = $ServerTmp
$env:TMP = $ServerTmp
$env:MAVEN_OPTS = "-XX:TieredStopAtLevel=1 -Djdk.attach.allowAttachSelf=true --add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.lang.reflect=ALL-UNNAMED --add-opens java.base/java.io=ALL-UNNAMED --add-opens java.base/java.util=ALL-UNNAMED"

$MvnArgs = @("test-compile", "org.pitest:pitest-maven:mutationCoverage") + $PitestArgs + $ExtraArgs + @(
    "-Dbuild.dist.dir=$ServerBuildDir"
    "-DskipProtobuf=true"
    "-Djava.io.tmpdir=$ServerTmp"
    "-Dmaven.repo.local=$ServerDir\.m2\repository"
)

$MvnCmd = Get-Command mvn.cmd -ErrorAction SilentlyContinue
$MvnExecutable = if ($null -eq $MvnCmd) { "mvn" } else { "mvn.cmd" }

Write-Host "Executing PITest mutation tests..." -ForegroundColor Green
& $MvnExecutable @MvnArgs

$Reports = Get-ChildItem -Path (Join-Path $ServerBuildDir "pit-reports") -Directory -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
if ($Reports.Count -gt 0) {
    $ReportPath = Join-Path $Reports[0].FullName "index.html"
    if (Test-Path $ReportPath) {
        Write-Host ""
        Write-Host "✅ Mutation Report Generated: $ReportPath" -ForegroundColor Green
    }
}
