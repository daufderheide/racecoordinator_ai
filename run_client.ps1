$ErrorActionPreference = "Stop"

Set-Location "$PSScriptRoot\client"

# Setup Node Environment
$NodePath = "C:\Program Files\nodejs"
if (Test-Path "$NodePath\npm.cmd") {
    $env:Path = "$NodePath;" + $env:Path
}

if (-not (Test-Path "node_modules")) {
    Write-Host "First time setup: Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Generating Protos..." -ForegroundColor Cyan
npm run proto:gen

Write-Host "Starting Client..." -ForegroundColor Green
npm start
