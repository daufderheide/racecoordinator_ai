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
} else {
    # If the directory exists, clear out 'dist' so we don't serve a stale angular build
    $StaleDist = Join-Path $IsolatedDir "dist"
    if (Test-Path $StaleDist) {
        Remove-Item -Path $StaleDist -Recurse -Force
    }
}

$env:PW_REPORT_PATH = Join-Path $IsolatedDir "pw-result.json"

# If sync-only, run Node.js script to promote actual images to expected and exit
if ($args -contains "--sync-only") {
    Write-Host "Syncing snapshots from last run's actual results..." -ForegroundColor Cyan
    $env:CLIENT_DIR = $ClientDir
    $env:ISOLATED_DIR = $IsolatedDir
    node (Join-Path $ProjectRoot "scripts" "sync_snapshots.js")
    exit 0
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
    Write-Host "Docker daemon is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

Write-Host "Running tests in Docker container..." -ForegroundColor Green

# Create test-home directory to avoid permission issues
New-Item -ItemType Directory -Path (Join-Path $IsolatedDir "test-home") -Force | Out-Null

$DockerArgs = @(
    "run", "--rm",
    "--ipc=host",
    "-v", "$IsolatedDir`:/work",
    "-w", "/work",
    "-e", "HOME=/work/test-home",
    "-e", "PWTEST_WORKERS=$(if ($env:PWTEST_WORKERS) { $env:PWTEST_WORKERS } else { '50%' })",
    "mcr.microsoft.com/playwright:v1.61.1-jammy",
    "/bin/bash", "-c", "npm install --no-package-lock --legacy-peer-deps --ignore-scripts && npx playwright test $args"
)

& docker @DockerArgs
$TestExitCode = $LASTEXITCODE

# If updating snapshots, copy them back to the original source directory
if ($args -contains "--update-snapshots") {
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
