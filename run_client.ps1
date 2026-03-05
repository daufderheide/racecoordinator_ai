$ErrorActionPreference = "Stop"

Set-Location "$PSScriptRoot\client"

# Setup Node Environment
$NodePath = "C:\Program Files\nodejs"
if (Test-Path "$NodePath\npm.cmd") {
    $env:Path = "$NodePath;" + $env:Path
}

if (-not (Test-Path "node_modules")) {
    Write-Host "First time setup: Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "Generating Protos..." -ForegroundColor Cyan
$ProtoDestDir = "src\app\proto"
if (-not (Test-Path $ProtoDestDir)) {
    New-Item -ItemType Directory -Path $ProtoDestDir -Force | Out-Null
}

$PbjsArgs = @(
    "-p", "../proto",
    "-t", "static-module",
    "-w", "es6",
    "-o", "src/app/proto/message.js",
    "../proto/client/model.proto",
    "../proto/client/driver_model.proto",
    "../proto/client/asset_model.proto",
    "../proto/client/asset_management.proto",
    "../proto/client/initialize_race.proto",
    "../proto/client/initialize_interface.proto",
    "../proto/client/update_interface_config.proto",
    "../proto/client/set_interface_pin_state.proto",
    "../proto/client/interface_event.proto",
    "../proto/client/start_race.proto",
    "../proto/client/pause_race.proto",
    "../proto/client/next_heat.proto",
    "../proto/client/restart_heat.proto",
    "../proto/client/skip_heat.proto",
    "../proto/client/defer_heat.proto",
    "../proto/client/race_subscription.proto",
    "../proto/client/arduino_config.proto",
    "../proto/server/race_state.proto",
    "../proto/server/asset_management_response.proto",
    "../proto/server/race_time.proto",
    "../proto/server/lap.proto",
    "../proto/server/race_data.proto",
    "../proto/server/race.proto",
    "../proto/server/race_participant.proto",
    "../proto/server/heat_data.proto",
    "../proto/server/heat.proto",
    "../proto/server/reaction_time.proto",
    "../proto/server/standings_update.proto",
    "../proto/server/overall_standings_update.proto"
)

npx pbjs @PbjsArgs
npx pbts -o src/app/proto/message.d.ts src/app/proto/message.js

Write-Host "Starting Client..." -ForegroundColor Green
npm start
