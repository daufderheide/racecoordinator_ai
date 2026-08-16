$ErrorActionPreference = "Continue"

$ProjectRoot = if ($PSScriptRoot) { $PSScriptRoot } elseif ($MyInvocation.MyCommand.Definition) { Split-Path -Parent $MyInvocation.MyCommand.Definition } else { $PWD.Path }

Write-Host "🚀 Starting all tests (PowerShell)..." -ForegroundColor Cyan

# 1. Server Tests
& (Join-Path $ProjectRoot "run_server_tests.ps1")
$ServerExitCode = $LASTEXITCODE

# 2. Client Tests (unit and visual)
& (Join-Path $ProjectRoot "run_client_tests.ps1")
$ClientExitCode = $LASTEXITCODE

# Summary
Write-Host ""
Write-Host "--- ✅ Global Test Summary ---" -ForegroundColor Cyan
if ($ServerExitCode -eq 0) {
    Write-Host "Server Tests: PASSED" -ForegroundColor Green
} else {
    Write-Host "Server Tests: FAILED" -ForegroundColor Red
}

if ($ClientExitCode -eq 0) {
    Write-Host "Client Tests: PASSED" -ForegroundColor Green
} else {
    Write-Host "Client Tests: FAILED" -ForegroundColor Red
}

$NodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue
if ($null -eq $NodeCmd) { $NodeCmd = Get-Command node -ErrorAction SilentlyContinue }
if ($NodeCmd) {
    & $NodeCmd.Source (Join-Path $ProjectRoot "scripts\audit_test_coverage.js")
}

if ($ServerExitCode -ne 0 -or $ClientExitCode -ne 0) {
    exit 1
}
