$ErrorActionPreference = "Continue"

# Resolve project root even when invoked via Start-Process
$ProjectRoot = if ($PSScriptRoot) { $PSScriptRoot } elseif ($MyInvocation.MyCommand.Definition) { Split-Path -Parent $MyInvocation.MyCommand.Definition } else { $PWD.Path }
$ClientDir = Join-Path $ProjectRoot "client"

Write-Host "--- Running Client Unit Tests ---" -ForegroundColor Cyan

Set-Location $ClientDir

# Find the Chrome binary from Playwright browsers
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $ClientDir "browsers"
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
$env:HOME = Join-Path $ClientDir "test-home"
if (-not (Test-Path $env:HOME)) {
    New-Item -ItemType Directory -Path $env:HOME -Force | Out-Null
}

# Execute tests
Write-Host "Executing unit tests..." -ForegroundColor Green
# Explicitly specify project name and working directory for Windows compatibility
# Only pass $args if it contains actual values to avoid empty argument errors
if ($args.Count -gt 0) {
    node_modules\.bin\ng test client --watch=false --browsers=ChromeHeadlessWithCustomConfig @args
} else {
    node_modules\.bin\ng test client --watch=false --browsers=ChromeHeadlessWithCustomConfig
}
