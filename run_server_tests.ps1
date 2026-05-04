$ErrorActionPreference = "Stop"

# Configuration
$ProjectRoot = if ($PSScriptRoot) { $PSScriptRoot } elseif ($MyInvocation.MyCommand.Definition) { Split-Path -Parent $MyInvocation.MyCommand.Definition } else { $PWD.Path }
$ServerDir = Join-Path $ProjectRoot "server"
$ServerTmp = Join-Path $ServerDir "target_tmp"
$ServerBuildDir = Join-Path $ServerTmp "target_test"

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
.\generate_protos.ps1 --server-only

# 2. Run tests
Write-Host "Executing Maven tests..." -ForegroundColor Green

# Simple fork count for Windows
$ForkCount = "1"
$ReuseForks = "true"

$env:PROTO_DEST_DIR = $ServerBuildDir
$env:npm_config_cache = Join-Path $ServerTmp "npm_cache"
$env:EMBEDDED_MONGO_ARTIFACTS = Join-Path $ServerTmp ".embedmongo"

# Ensure all temp directories are on the same drive to avoid cross-drive file move issues
$env:TEMP = $ServerTmp
$env:TMP = $ServerTmp

# JVM optimization for faster startup in tests
$env:MAVEN_OPTS = "-XX:TieredStopAtLevel=1 -Djdk.attach.allowAttachSelf=true --add-opens java.base/java.lang=ALL-UNNAMED --add-opens java.base/java.lang.reflect=ALL-UNNAMED --add-opens java.base/java.io=ALL-UNNAMED --add-opens java.base/java.util=ALL-UNNAMED"

$MvnArgs = @("test") + $args + @(
    "-Dbuild.dist.dir=$ServerBuildDir"
    "-DskipProtobuf=true"
    "-DforkCount=$ForkCount"
    "-DreuseForks=$ReuseForks"
    "-Djava.io.tmpdir=$ServerTmp"
    "-Dde.flapdoodle.embed.mongo.artifacts=$ServerTmp\.embedmongo"
    "-Dmaven.repo.local=$ServerDir\.m2\repository"
)

& mvn @MvnArgs
