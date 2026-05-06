<#
.SYNOPSIS
    Starts the Race Coordinator AI Server and Client.
    
.DESCRIPTION
    1. Starts the Java Server in a new window.
    2. Waits for the server to be healthy (http://localhost:7070/api/version).
    3. Starts the Angular Client in the current window.
    4. Automatically opens the browser (via npm start).
#>

$ErrorActionPreference = "Stop"

# Get the root directory (parent of the scripts directory)
$SCRIPT_PATH = Split-Path -Parent $MyInvocation.MyCommand.Path
$ROOT_DIR = (Get-Item $SCRIPT_PATH).Parent.FullName
Set-Location $ROOT_DIR

Write-Host "`n--- Race Coordinator AI Startup ---" -ForegroundColor Cyan

# Check if ports are already in use
$port7070 = Get-NetTCPConnection -LocalPort 7070 -ErrorAction SilentlyContinue
$port4200 = Get-NetTCPConnection -LocalPort 4200 -ErrorAction SilentlyContinue

if ($port7070 -or $port4200) {
    Write-Host "Warning: Ports 7070 or 4200 are already in use." -ForegroundColor Yellow
    $choice = Read-Host "Would you like to run the kill script first? (y/n)"
    if ($choice -eq 'y') {
        Write-Host "Running kill_client_server.ps1..." -ForegroundColor Gray
        & powershell -ExecutionPolicy Bypass -File ".\kill_client_server.ps1"
        Start-Sleep -Seconds 2
    }
}

# 1. Start Server
Write-Host "[1/3] Starting Java Server in a new window..." -ForegroundColor Green
# We use Start-Process to run the server in a separate window so logs don't mix and both are visible.
# We pass --headless to prevent the server from opening its own browser window (client will do it)
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy Bypass", "-File", ".\run_server.ps1", "--headless" -WorkingDirectory $ROOT_DIR

# 2. Verify Running
Write-Host "[2/3] Waiting for server to be ready at http://localhost:7070..." -ForegroundColor Yellow
$serverReady = $false
$maxRetries = 60
$retryCount = 0

while (-not $serverReady -and $retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:7070/api/version" -Method Get -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $serverReady = $true
            Write-Host "`nServer is ready! (Version: $($response.Content))" -ForegroundColor Green
        }
    } catch {
        # Ignore errors while waiting
    }
    
    if (-not $serverReady) {
        $retryCount++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
}

if (-not $serverReady) {
    Write-Host "`nError: Server failed to start within 2 minutes. Please check the server window for errors." -ForegroundColor Red
    exit 1
}

# 3. Start Client
Write-Host "[3/3] Starting Angular Client..." -ForegroundColor Green
Write-Host "The browser will open automatically once the client is ready." -ForegroundColor Gray
# This will run in the current window and block.
& powershell -ExecutionPolicy Bypass -File ".\run_client.ps1"
