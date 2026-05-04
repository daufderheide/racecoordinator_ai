$ErrorActionPreference = "Continue"

# Resolve project root even when invoked via Start-Process
$ProjectRoot = if ($PSScriptRoot) { $PSScriptRoot } elseif ($MyInvocation.MyCommand.Definition) { Split-Path -Parent $MyInvocation.MyCommand.Definition } else { $PWD.Path }
$ClientDir = Join-Path $ProjectRoot "client"
$IsolatedDir = Join-Path $env:TEMP "racecoordinator-client-unit"

if (-not (Test-Path $IsolatedDir)) {
    New-Item -ItemType Directory -Path $IsolatedDir -Force | Out-Null
}

Write-Host "--- Running Client Unit Tests ---" -ForegroundColor Cyan

# Sync current source and configuration to isolated directory
Write-Host "Syncing source to $IsolatedDir..." -ForegroundColor Gray

$ItemsToSync = @("src", "karma.conf.js", "package.json", "angular.json", "tsconfig.json", "tsconfig.app.json", "tsconfig.spec.json", "package-lock.json")

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

# Ensure dependencies are installed in isolated directory
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing/Updating dependencies in $IsolatedDir..." -ForegroundColor Yellow
    npm install --no-package-lock --legacy-peer-deps --loglevel error
}

# Find the Chrome binary from Playwright browsers
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $IsolatedDir "browsers"
if (-not (Test-Path $env:PLAYWRIGHT_BROWSERS_PATH)) {
    New-Item -ItemType Directory -Path $env:PLAYWRIGHT_BROWSERS_PATH -Force | Out-Null
}

# Prefer headless-shell if available
$ChromeBin = Get-ChildItem -Path $env:PLAYWRIGHT_BROWSERS_PATH -Filter "chrome-headless-shell.exe" -Recurse | Select-Object -First 1 -ExpandProperty FullName

if ([string]::IsNullOrEmpty($ChromeBin)) {
    # Fallback to full chrome
    $ChromeBin = Get-ChildItem -Path $env:PLAYWRIGHT_BROWSERS_PATH -Filter "chrome.exe" -Recurse | Select-Object -First 1 -ExpandProperty FullName
}

if ([string]::IsNullOrEmpty($ChromeBin)) {
    Write-Host "Installing Playwright browsers..." -ForegroundColor Yellow
    npx playwright install chromium
    $ChromeBin = Get-ChildItem -Path $env:PLAYWRIGHT_BROWSERS_PATH -Filter "chrome-headless-shell.exe" -Recurse | Select-Object -First 1 -ExpandProperty FullName
}

Write-Host "Using Chrome binary at: $ChromeBin" -ForegroundColor Gray
$env:CHROME_BIN = $ChromeBin

# Re-route Angular cache to avoid EPERM issues
$env:HOME = Join-Path $IsolatedDir "test-home"
if (-not (Test-Path $env:HOME)) {
    New-Item -ItemType Directory -Path $env:HOME -Force | Out-Null
}

# Execute tests
Write-Host "Executing unit tests..." -ForegroundColor Green
node_modules\.bin\ng test --watch=false --browsers=ChromeHeadlessWithCustomConfig $args
