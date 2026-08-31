$ErrorActionPreference = "Continue"

# Resolve project root even when invoked via Start-Process
$ProjectRoot = if ($PSScriptRoot) { $PSScriptRoot } elseif ($MyInvocation.MyCommand.Definition) { Split-Path -Parent $MyInvocation.MyCommand.Definition } else { $PWD.Path }
$ClientDir = Join-Path $ProjectRoot "client"

# Setup local Node.js if exists
$LocalNodeDir = Join-Path $ProjectRoot "tools\node"
if (Test-Path $LocalNodeDir) {
    $env:Path = $LocalNodeDir + ";" + $env:Path
}
$IsolatedDir = Join-Path $env:TEMP "racecoordinator-client-visual"

if (-not (Test-Path $IsolatedDir)) {
    New-Item -ItemType Directory -Path $IsolatedDir -Force | Out-Null
    # If the directory exists, clear out 'dist' and 'test-results' so we don't serve a stale angular build or fail on Docker rmdir
    $StaleDist = Join-Path $IsolatedDir "dist"
    if (Test-Path $StaleDist) {
        Remove-Item -Path $StaleDist -Recurse -Force
    }
    $StaleResults = Join-Path $IsolatedDir "test-results"
    if (Test-Path $StaleResults) {
        Remove-Item -Path $StaleResults -Recurse -Force
    }
}

$env:PW_REPORT_PATH = Join-Path $IsolatedDir "pw-result.json"

# If sync-only, run Node.js script to promote actual images to expected and exit
if ($args -contains "--sync-only") {
    Write-Host "Syncing snapshots from last run's actual results..." -ForegroundColor Cyan
    $env:CLIENT_DIR = $ClientDir
    $env:ISOLATED_DIR = $IsolatedDir
    node (Join-Path $ProjectRoot "scripts\sync_snapshots.js")
    exit 0
}

# Check if --changed or --changed=* was passed
$ChangedFlag = $null
$RemainingArgs = @()

foreach ($arg in $args) {
    if ($arg -eq "--changed" -or $arg -like "--changed=*") {
        $ChangedFlag = $arg
    } else {
        $RemainingArgs += $arg
    }
}

$FindScript = Join-Path $ProjectRoot "scripts\find_changed_screendiff_tests.js"
$TotalTests = (node $FindScript --count-all).Trim()

if ($ChangedFlag) {
    Write-Host "Resolving screendiff tests for changed files..." -ForegroundColor Cyan
    $ChangedTests = (node $FindScript $ChangedFlag).Trim()
    if (-not $ChangedTests) {
        Write-Host "No changed components or screendiff tests detected from git changes." -ForegroundColor Yellow
        exit 0
    }
    $ChangedCount = ($ChangedTests -split '\s+').Count
    Write-Host "Running $ChangedCount of $TotalTests screendiff tests..." -ForegroundColor Green
    $PlaywrightArgs = "$ChangedTests " + ($RemainingArgs -join " ")
} else {
    Write-Host "Running all $TotalTests of $TotalTests screendiff tests..." -ForegroundColor Green
    $PlaywrightArgs = $args -join " "
}

Write-Host "--- Running Client Visual Tests ---" -ForegroundColor Cyan

# Sync current source and configuration to isolated directory
Write-Host "Syncing source to $IsolatedDir..." -ForegroundColor Gray

$ItemsToSync = @("src", "scripts", "package.json", "angular.json", "playwright.config.ts", "tsconfig.json", "tsconfig.app.json", "tsconfig.spec.json")

foreach ($item in $ItemsToSync) {
    $sourcePath = Join-Path $ClientDir $item
    if (Test-Path $sourcePath) {
        $destPath = Join-Path $IsolatedDir $item
        if (Test-Path $destPath) {
             Remove-Item -Path $destPath -Recurse -Force
        }
        Copy-Item -Path $sourcePath -Destination $IsolatedDir -Recurse -Force
    }
}

Set-Location $IsolatedDir

# Check for Docker
if (-not (Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-Host "Docker is required but not installed." -ForegroundColor Red
    Write-Host "Attempting to install Docker via winget..." -ForegroundColor Yellow
    if (Get-Command "winget" -ErrorAction SilentlyContinue) {
        winget install Docker.DockerDesktop
        Write-Host "`n========================================================" -ForegroundColor Magenta
        Write-Host "IMPORTANT: Docker Desktop has been installed." -ForegroundColor Magenta
        Write-Host "You must manually open Docker Desktop from your Start Menu" -ForegroundColor Magenta
        Write-Host "and it may require a system reboot before it works properly." -ForegroundColor Magenta
        Write-Host "Please do this, and then re-run this script." -ForegroundColor Magenta
        Write-Host "========================================================`n" -ForegroundColor Magenta
        exit 1
    } else {
        Write-Host "winget not found. Please install Docker manually from https://www.docker.com/" -ForegroundColor Red
        exit 1
    }
}

# Make sure Docker daemon is running
$dockerInfo = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n*****************************************************************" -ForegroundColor Red
    Write-Host "* ERROR: Docker daemon is not running!                          *" -ForegroundColor Red
    Write-Host "* The visual tests require Docker to ensure identical rendering.*" -ForegroundColor Red
    Write-Host "* Please start Docker Desktop and try again.                    *" -ForegroundColor Red
    Write-Host "*****************************************************************`n" -ForegroundColor Red
    exit 1
}

Write-Host "Running tests in Docker container..." -ForegroundColor Green

# Create test-home directory to avoid permission issues
New-Item -ItemType Directory -Path (Join-Path $IsolatedDir "test-home") -Force | Out-Null

$WorkerCount = if ($env:PWTEST_WORKERS) { $env:PWTEST_WORKERS } else { '100%' }
$DockerCmd = "node -e `"const fs=require('fs'),crypto=require('crypto');const hash=crypto.createHash('md5').update(fs.readFileSync('package.json')).digest('hex');if(!fs.existsSync('node_modules')||!fs.existsSync('.installed-hash')||fs.readFileSync('.installed-hash','utf8').trim()!==hash){console.log('Dependencies changed or missing, installing...');require('child_process').execSync('npm install --no-package-lock --legacy-peer-deps --ignore-scripts',{stdio:'inherit'});fs.writeFileSync('.installed-hash',hash);}`" && rm -rf /work/test-results && npx playwright test $PlaywrightArgs"

$DockerArgs = @(
    "run", "--rm",
    "--ipc=host",
    "-v", "$IsolatedDir`:/work",
    "-w", "/work",
    "-e", "HOME=/work/test-home",
    "-e", "PWTEST_WORKERS=$WorkerCount",
    "mcr.microsoft.com/playwright:v1.61.1-jammy",
    "/bin/bash", "-c", $DockerCmd
)

& docker @DockerArgs
$TestExitCode = $LASTEXITCODE

# If updating snapshots and tests succeeded, copy them back to the original source directory
if ($TestExitCode -eq 0 -and ($args -contains "--update-snapshots" -or $PlaywrightArgs -like "*--update-snapshots*")) {
    Write-Host "Syncing updated snapshots back to source..." -ForegroundColor Cyan
    $FullIsolatedDir = (Get-Item $IsolatedDir).FullName
    $SnapshotDirs = Get-ChildItem -Path (Join-Path $FullIsolatedDir "src") -Filter "*-snapshots" -Recurse -Directory
    foreach ($dir in $SnapshotDirs) {
        $relativePath = $dir.FullName.Substring($FullIsolatedDir.Length + 1)
        $destPath = Join-Path $ClientDir $relativePath
        if (-not (Test-Path $destPath)) {
            New-Item -ItemType Directory -Path $destPath -Force | Out-Null
        }
        Copy-Item -Path (Join-Path $dir.FullName "*") -Destination $destPath -Force
        Write-Host "Copied snapshots to $destPath" -ForegroundColor Gray
    }
}

if ($TestExitCode -ne 0) {
    Write-Host "`nTests failed. Opening report..." -ForegroundColor Yellow
    Set-Location $ClientDir
    npx playwright show-report (Join-Path $IsolatedDir "playwright-report")
}

exit $TestExitCode
