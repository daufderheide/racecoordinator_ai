$ErrorActionPreference = "Stop"

Set-Location "$PSScriptRoot\client"

# Setup Node Environment
$PotentialNodeHome = "$PSScriptRoot\tools\node22\node-v22.13.1-win-x64"
if (-not (Test-Path $PotentialNodeHome)) {
    $PotentialNodeHome = "$PSScriptRoot\tools\node\node-v20.12.2-win-x64"
}

if (Test-Path $PotentialNodeHome) {
    $env:Path = "$PotentialNodeHome;" + $env:Path
} else {
    # Fallback to system node
    $NodePath = "C:\Program Files\nodejs"
    if (Test-Path "$NodePath\npm.cmd") {
        $env:Path = "$NodePath;" + $env:Path
    }
}

if (-not (Test-Path "node_modules")) {
    Write-Host "First time setup: Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Generating Protos..." -ForegroundColor Cyan
if (-not (Test-Path "src/app/proto")) { New-Item -ItemType Directory -Path "src/app/proto" | Out-Null }
# Use relative paths for pbjs to avoid duplicate definitions when files are imported
$ClientProtos = Get-ChildItem ../server/proto/client/*.proto | Resolve-Path -Relative
$ServerProtos = Get-ChildItem ../server/proto/server/*.proto | Resolve-Path -Relative
$ProtoFiles = $ClientProtos + $ServerProtos

& npx pbjs -p ../server/proto -t static-module -w es6 -o src/app/proto/message.js $ProtoFiles
& npx pbts -o src/app/proto/message.d.ts src/app/proto/message.js

Write-Host "Starting Client..." -ForegroundColor Green
npm start -- --open
