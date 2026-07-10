param(
    [switch]$Open
)
$ErrorActionPreference = "Stop"

# Setup Node Environment
$NpmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
$LocalNodeDir = Join-Path $PSScriptRoot "tools\node"

if (-not $NpmCmd) {
    $CommonNodePaths = @(
        "C:\Program Files\nodejs",
        "C:\Program Files (x86)\nodejs"
    )
    $FoundNode = Get-Item $CommonNodePaths -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($FoundNode) {
        $env:Path = $FoundNode.FullName + ";" + $env:Path
        Write-Host "Dynamically added Node.js to PATH: $($FoundNode.FullName)" -ForegroundColor Green
        $NpmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
    }
}

if (-not $NpmCmd) {
    if (Test-Path $LocalNodeDir) {
        $env:Path = $LocalNodeDir + ";" + $env:Path
        Write-Host "Dynamically added local Node.js to PATH: $LocalNodeDir" -ForegroundColor Green
        $NpmCmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
    }
}

if (-not $NpmCmd) {
    Write-Host "Node.js/npm not found on system PATH or common locations." -ForegroundColor Yellow
    Write-Host "Downloading portable Node.js v22.13.0..." -ForegroundColor Cyan
    
    $ToolsDir = Join-Path $PSScriptRoot "tools"
    if (-not (Test-Path $ToolsDir)) {
        New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null
    }
    $ZipPath = Join-Path $ToolsDir "node.zip"
    $Arch = if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64" -or $env:PROCESSOR_ARCHITEW6432 -eq "ARM64") { "arm64" } else { "x64" }
    $NodeUrl = "https://nodejs.org/dist/v22.13.0/node-v22.13.0-win-$Arch.zip"
    
    # Download Node.js
    Invoke-WebRequest -Uri $NodeUrl -OutFile $ZipPath
    
    # Extract Node.js
    Write-Host "Extracting Node.js..." -ForegroundColor Cyan
    Expand-Archive -Path $ZipPath -DestinationPath $ToolsDir -Force
    
    # Rename extracted folder to 'node'
    $ExtractedFolder = Join-Path $ToolsDir "node-v22.13.0-win-$Arch"
    if (Test-Path $LocalNodeDir) {
        Remove-Item -Recurse -Force $LocalNodeDir | Out-Null
    }
    Rename-Item -Path $ExtractedFolder -NewName "node"
    Remove-Item -Force $ZipPath | Out-Null
    
    $env:Path = $LocalNodeDir + ";" + $env:Path
    Write-Host "Node.js set up successfully in $LocalNodeDir" -ForegroundColor Green
}

Set-Location "$PSScriptRoot\client"

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
if ($Open) {
    npm start -- --open
} else {
    npm start
}
