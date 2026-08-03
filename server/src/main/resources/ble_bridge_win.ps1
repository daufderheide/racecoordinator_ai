# Windows Native WinRT BLE Helper for Race Coordinator AI
# Usage:
#   powershell -File ble_bridge_win.ps1 scan [timeoutSec]
#   powershell -File ble_bridge_win.ps1 connect <deviceNameOrUUID>

param (
    [string]$Command,
    [string]$Target
)

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$asyncOperationType = [System.WindowsRuntimeSystemExtensions]

if ($Command -eq "scan") {
    $timeoutSec = 2.0
    if ($Target -as [double]) {
        $timeoutSec = [double]$Target
    }

    [void][Windows.Devices.Bluetooth.Advertisement.BluetoothLEAdvertisementWatcher, Windows.Devices.Bluetooth, ContentType = WindowsRuntime]
    $watcher = New-Object Windows.Devices.Bluetooth.Advertisement.BluetoothLEAdvertisementWatcher
    $watcher.ScanningMode = [Windows.Devices.Bluetooth.Advertisement.BluetoothLEScanningMode]::Active

    $discoveredNames = New-Object System.Collections.Generic.HashSet[string]

    $handler = [Windows.Foundation.TypedEventHandler[Windows.Devices.Bluetooth.Advertisement.BluetoothLEAdvertisementWatcher, Windows.Devices.Bluetooth.Advertisement.BluetoothLEAdvertisementReceivedEventArgs]]{
        param($sender, $args)
        $name = $args.Advertisement.LocalName
        if (-not [string]::IsNullOrWhiteSpace($name)) {
            [void]$discoveredNames.Add($name.Trim())
        }
    }

    $watcher.add_Received($handler)
    $watcher.Start()
    Start-Sleep -Milliseconds ([int]($timeoutSec * 1000))
    $watcher.Stop()

    $json = ConvertTo-Json @($discoveredNames) -Compress
    Write-Output $json
    exit 0
}
elseif ($Command -eq "connect") {
    Write-Host "STATUS: Windows WinRT BLE Connection initializing for $Target..."
    # Connect logic for Windows WinRT BluetoothLEDevice
    exit 0
}
else {
    Write-Error "Usage: ble_bridge_win.ps1 scan [timeoutSec] OR connect <deviceNameOrUUID>"
    exit 1
}
