Write-Host "Killing client and server processes..." -ForegroundColor Cyan

# Ports: 4200 (Client), 7070 (Server), 27017 (Mongo)
$Ports = @(4200, 7070, 27017)
$KilledProcesses = @()

foreach ($Port in $Ports) {
    $connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    foreach ($conn in $connections) {
        $processId = $conn.OwningProcess
        if ($processId -gt 0 -and $KilledProcesses -notcontains $processId) {
            try {
                Write-Host "Killing process $processId on port $Port..." -ForegroundColor Yellow
                Stop-Process -Id $processId -Force -ErrorAction Stop
                $KilledProcesses += $processId
            } catch {
                Write-Host "Could not kill process $processId on port $Port - $($_.Exception.Message)" -ForegroundColor Yellow
            }
        }
    }
}

# Also kill by name as fallback
Get-Process -Name java, node, mongod -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_.Id -gt 0 -and $KilledProcesses -notcontains $_.Id) {
        try {
            Write-Host "Killing $($_.ProcessName) process $($_.Id)..." -ForegroundColor Yellow
            Stop-Process -Id $_.Id -Force -ErrorAction Stop
            $KilledProcesses += $_.Id
        } catch {
            Write-Host "Could not kill $($_.ProcessName) process $($_.Id) - $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}

Write-Host "Done. Killed $($KilledProcesses.Count) processes." -ForegroundColor Green
