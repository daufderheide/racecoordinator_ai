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
    "-p", "../server/proto",
    "-t", "static-module",
    "-w", "es6",
    "-o", "src/app/proto/message.js",
    "../server/proto/client/model.proto",
    "../server/proto/client/driver_model.proto",
    "../server/proto/client/asset_model.proto",
    "../server/proto/client/asset_management.proto",
    "../server/proto/client/initialize_race.proto",
    "../server/proto/client/initialize_interface.proto",
    "../server/proto/client/update_interface_config.proto",
    "../server/proto/client/set_interface_rgb_led_state.proto",
    "../server/proto/client/set_interface_pin_state.proto",
    "../server/proto/client/interface_event.proto",
    "../server/proto/client/start_race.proto",
    "../server/proto/client/pause_race.proto",
    "../server/proto/client/next_heat.proto",
    "../server/proto/client/restart_heat.proto",
    "../server/proto/client/skip_heat.proto",
    "../server/proto/client/defer_heat.proto",
    "../server/proto/client/race_subscription.proto",
    "../server/proto/client/arduino_config.proto",
    "../server/proto/server/race_state.proto",
    "../server/proto/server/asset_management_response.proto",
    "../server/proto/server/race_time.proto",
    "../server/proto/server/lap.proto",
    "../server/proto/server/race_data.proto",
    "../server/proto/server/race.proto",
    "../server/proto/server/race_participant.proto",
    "../server/proto/server/heat_data.proto",
    "../server/proto/server/heat.proto",
    "../server/proto/server/reaction_time.proto",
    "../server/proto/server/standings_update.proto",
    "../server/proto/server/overall_standings_update.proto"
)

npx pbjs @PbjsArgs
npx pbts -o src/app/proto/message.d.ts src/app/proto/message.js

Write-Host "Starting Client..." -ForegroundColor Green
npm start
