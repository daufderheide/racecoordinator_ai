Write-Host "Checking for processes on port 27017..." -ForegroundColor Cyan
$conn = Get-NetTCPConnection -LocalPort 27017 -ErrorAction SilentlyContinue
if ($conn) {
    Write-Host "Found process $($conn.OwningProcess) on port 27017. Killing..." -ForegroundColor Yellow
    Stop-Process -Id $conn.OwningProcess -Force
    Write-Host "Process killed." -ForegroundColor Green
} else {
    Write-Host "No process found on port 27017." -ForegroundColor Green
}
