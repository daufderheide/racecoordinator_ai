$ErrorActionPreference = "Stop"

Set-Location "$PSScriptRoot\client"

# Setup Node Environment
$NpmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $NpmCmd) {
    $CommonNodePaths = @(
        "C:\Program Files\nodejs",
        "C:\Program Files (x86)\nodejs"
    )
    $FoundNode = Get-Item $CommonNodePaths -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($FoundNode) {
        $env:Path = $FoundNode.FullName + ";" + $env:Path
        Write-Host "Dynamically added Node.js to PATH: $($FoundNode.FullName)" -ForegroundColor Green
    } else {
        Write-Warning "Could not dynamically find Node.js. Ensure Node.js is installed and in PATH."
    }
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
