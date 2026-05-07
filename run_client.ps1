$ErrorActionPreference = "Stop"

Set-Location "$PSScriptRoot\client"

# Setup Node Environment
$PotentialNodeHome = "$PSScriptRoot\tools\node22\node-v22.13.1-win-x64"
if (-not (Test-Path $PotentialNodeHome)) {
    $PotentialNodeHome = "$PSScriptRoot\tools\node\node-v20.12.2-win-x64"
}

if (Test-Path $PotentialNodeHome) {
    $env:Path = "$PotentialNodeHome;" + $env:Path
} else {
    # Fallback to system node
    $NodePath = "C:\Program Files\nodejs"
    if (Test-Path "$NodePath\npm.cmd") {
        $env:Path = "$NodePath;" + $env:Path
    }
}

if (-not (Test-Path "node_modules")) {
    Write-Host "First time setup: Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Generating Protos..." -ForegroundColor Cyan
npm run proto:gen

Write-Host "Starting Client..." -ForegroundColor Green
npm start -- --open
