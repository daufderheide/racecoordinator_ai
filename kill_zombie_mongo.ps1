Write-Host "Checking for processes on ports 8085 (embedded) and 27017 (default)..." -ForegroundColor Cyan
$Ports = @(8085, 27017)
foreach ($Port in $Ports) {
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $processId = $conn.OwningProcess
        if ($processId -gt 0) {
            Write-Host "Found process $processId on port $Port. Killing..." -ForegroundColor Yellow
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
            Write-Host "Process $processId killed." -ForegroundColor Green
        }
    }
}
