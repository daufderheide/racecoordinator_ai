$ErrorActionPreference = "Stop"
$ClientDir = Join-Path $PSScriptRoot "client"
$LocalNodeDir = Join-Path $PSScriptRoot "tools\node"
if (Test-Path -LiteralPath $LocalNodeDir) {
    $env:Path = "$LocalNodeDir;$env:Path"
}

function Find-PlaywrightChromium([string]$BrowserPath) {
    if (-not (Test-Path -LiteralPath $BrowserPath -PathType Container)) { return }

    # Only scan the browser revision and platform directories.
    foreach ($binary in @("chrome-headless-shell.exe", "chrome.exe")) {
        $Match = Get-ChildItem -LiteralPath $BrowserPath -Filter $binary -File -Depth 2 |
            Select-Object -First 1 -ExpandProperty FullName
        if ($Match) { return $Match }
    }
}

Write-Host "--- Running Client Unit Tests ---" -ForegroundColor Cyan

if ($env:PLAYWRIGHT_BROWSERS_PATH -and $env:PLAYWRIGHT_BROWSERS_PATH -ne "0") {
    $env:PLAYWRIGHT_BROWSERS_PATH = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath(
        $env:PLAYWRIGHT_BROWSERS_PATH
    )
}

Push-Location $ClientDir
try {
    if (-not $env:CHROME_BIN) {
        $BrowserPath = $env:PLAYWRIGHT_BROWSERS_PATH
        if ($BrowserPath -eq "0") {
            $BrowserPath = Join-Path $ClientDir "node_modules\playwright-core\.local-browsers"
        } elseif (-not $BrowserPath) {
            $BrowserPath = Join-Path $ClientDir "browsers"
        }
        $ChromeBin = Find-PlaywrightChromium $BrowserPath
        if (-not $ChromeBin -and -not $env:PLAYWRIGHT_BROWSERS_PATH -and $env:LOCALAPPDATA) {
            $ChromeBin = Find-PlaywrightChromium (Join-Path $env:LOCALAPPDATA "ms-playwright")
        }

        if (-not $ChromeBin) {
            if (-not $env:PLAYWRIGHT_BROWSERS_PATH) {
                $env:PLAYWRIGHT_BROWSERS_PATH = $BrowserPath
            }
            Write-Host "Installing the Chromium headless shell..." -ForegroundColor Yellow
            node node_modules/@playwright/test/cli.js install chromium --only-shell
            if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
            $ChromeBin = Find-PlaywrightChromium $BrowserPath
            if (-not $ChromeBin) { throw "The Chromium installation did not produce a usable executable." }
        }
        $env:CHROME_BIN = $ChromeBin
    }

    Write-Host "Using Chrome binary at: $env:CHROME_BIN" -ForegroundColor Gray
    node scripts\link-custom-widgets-modules.js
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

    $KarmaArgs = @("test", "client", "--watch=false", "--code-coverage", "--no-progress", "--browsers=ChromeHeadlessWithCustomConfig")
    if (-not ($args -match '^--reporters(?:=|$)')) {
        $KarmaArgs += "--reporters=dots,timing,coverage"
    }
    node node_modules/@angular/cli/bin/ng.js @KarmaArgs @args
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
