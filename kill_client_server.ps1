Write-Host "Killing client and server processes..." -ForegroundColor Cyan

# Ports: 4200 (Client), 7070 (Server), 27017 (Mongo)
$Ports = @(4200, 7070, 27017)

foreach ($Port in $Ports) {
    $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "Killing process $($conn.OwningProcess) on port $Port..." -ForegroundColor Yellow
        Stop-Process -Id $conn.OwningProcess -Force
    }
}

# Also kill by name as fallback
Get-Process -Name java, node, mongod -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Done." -ForegroundColor Green
