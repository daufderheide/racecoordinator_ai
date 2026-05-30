$ErrorActionPreference = "Continue"

# $PSScriptRoot is set automatically by PowerShell to the script's directory.

Write-Host "🚀 Starting all client tests..." -ForegroundColor Green

# 1. Unit Tests
Write-Host "`n--- Running Unit Tests ---" -ForegroundColor Cyan
& "$PSScriptRoot\run_client_unit_tests.ps1"
$UnitExitCode = $LASTEXITCODE

# 2. Visual Tests
Write-Host "`n--- Running Visual Tests ---" -ForegroundColor Cyan
& "$PSScriptRoot\run_client_screendiff_tests.ps1"
$VisualExitCode = $LASTEXITCODE

# Summary
Write-Host "`n--- ✅ Client Test Summary ---" -ForegroundColor Green
if ($UnitExitCode -eq 0) { Write-Host "Client Unit Tests: PASSED" -ForegroundColor Green } else { Write-Host "Client Unit Tests: FAILED" -ForegroundColor Red }
if ($VisualExitCode -eq 0) { Write-Host "Client Visual Tests: PASSED" -ForegroundColor Green } else { Write-Host "Client Visual Tests: FAILED" -ForegroundColor Red }

if ($UnitExitCode -ne 0 -or $VisualExitCode -ne 0) {
    exit 1
}
