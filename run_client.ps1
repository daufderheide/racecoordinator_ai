$ErrorActionPreference = "Stop"

Set-Location "$PSScriptRoot\client"

# Setup Node Environment
$NodePath = "C:\Program Files\nodejs"
if (Test-Path "$NodePath\npm.cmd") {
    $env:Path = "$NodePath;" + $env:Path
}

$DependenciesMissing = -not (Test-Path "node_modules")
$PackageJsonChanged = (Test-Path "node_modules") -and ((Get-Item "package.json").LastWriteTime -gt (Get-Item "node_modules").LastWriteTime)
$PackageLockChanged = (Test-Path "node_modules") -and ((Get-Item "package-lock.json").LastWriteTime -gt (Get-Item "node_modules").LastWriteTime)

if ($DependenciesMissing -or $PackageJsonChanged -or $PackageLockChanged) {
    Write-Host "Installing/updating dependencies..." -ForegroundColor Yellow
    npm install
    (Get-Item "node_modules").LastWriteTime = Get-Date
}

Write-Host "Generating Protos..." -ForegroundColor Cyan
npm run proto:gen

Write-Host "Starting Client..." -ForegroundColor Green
npm start
