$ErrorActionPreference = "Continue"

# Resolve project root even when invoked via Start-Process
$ProjectRoot = if ($PSScriptRoot) { $PSScriptRoot } elseif ($MyInvocation.MyCommand.Definition) { Split-Path -Parent $MyInvocation.MyCommand.Definition } else { $PWD.Path }
$ClientDir = Join-Path $ProjectRoot "client"
$IsolatedDir = Join-Path $env:TEMP "racecoordinator-client-visual"

if (-not (Test-Path $IsolatedDir)) {
    New-Item -ItemType Directory -Path $IsolatedDir -Force | Out-Null
}

$env:PW_REPORT_PATH = Join-Path $IsolatedDir "pw-result.json"

# If sync-only, run Node.js script to promote actual images to expected and exit
if ($args -contains "--sync-only") {
    Write-Host "Syncing snapshots from last run's actual results..." -ForegroundColor Cyan
    $env:CLIENT_DIR = $ClientDir
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

# Ensure dependencies are installed in isolated directory
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing/Updating dependencies in $IsolatedDir..." -ForegroundColor Yellow
    npm install --no-package-lock --legacy-peer-deps --ignore-scripts --loglevel error
}

# Find/Install Playwright browsers in isolated directory
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path $IsolatedDir "browsers"
if (-not (Test-Path $env:PLAYWRIGHT_BROWSERS_PATH)) {
    New-Item -ItemType Directory -Path $env:PLAYWRIGHT_BROWSERS_PATH -Force | Out-Null
}

if (-not (Test-Path (Join-Path $env:PLAYWRIGHT_BROWSERS_PATH "chromium"))) {
    Write-Host "Installing Playwright browsers..." -ForegroundColor Yellow
    npx playwright install chromium webkit
}

# Run the tests
Write-Host "Executing Playwright tests..." -ForegroundColor Green
# We use npx directly or through npm run test:visual
# Passing all arguments received by the script to playwright
npx playwright test $args

# If updating snapshots, copy them back to the original source directory
if ($args -contains "--update-snapshots") {
    Write-Host "Syncing updated snapshots back to source..." -ForegroundColor Cyan
    $SnapshotDirs = Get-ChildItem -Path (Join-Path $IsolatedDir "src") -Filter "*-snapshots" -Recurse -Directory
    foreach ($dir in $SnapshotDirs) {
        $relativePath = $dir.FullName.Substring($IsolatedDir.Length + 1)
        $destPath = Join-Path $ClientDir $relativePath
        if (-not (Test-Path $destPath)) {
            New-Item -ItemType Directory -Path $destPath -Force | Out-Null
        }
        Copy-Item -Path (Join-Path $dir.FullName "*") -Destination $destPath -Force
        Write-Host "Copied snapshots to $destPath" -ForegroundColor Gray
    }
}
