const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("Starting protobuf generation...");

const protoOutputDir = path.join(__dirname, "..", "src", "app", "proto");
if (!fs.existsSync(protoOutputDir)) {
  fs.mkdirSync(protoOutputDir, { recursive: true });
  console.log(`Created directory: ${protoOutputDir}`);
}

const pbjsPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "protobufjs-cli",
  "bin",
  "pbjs",
);
const pbtsPath = path.join(
  __dirname,
  "..",
  "node_modules",
  "protobufjs-cli",
  "bin",
  "pbts",
);

const protoFiles = [
  "../server/proto/client/model.proto",
  "../server/proto/client/driver_model.proto",
  "../server/proto/client/rotation_model.proto",
  "../server/proto/client/asset_model.proto",
  "../server/proto/client/asset_management.proto",
  "../server/proto/client/demo_config.proto",
  "../server/proto/client/initialize_race.proto",
  "../server/proto/client/initialize_interface.proto",
  "../server/proto/client/update_interface_config.proto",
  "../server/proto/client/set_interface_pin_state.proto",
  "../server/proto/client/set_interface_rgb_led_state.proto",
  "../server/proto/client/interface_event.proto",
  "../server/proto/client/start_race.proto",
  "../server/proto/client/pause_race.proto",
  "../server/proto/client/next_heat.proto",
  "../server/proto/client/restart_heat.proto",
  "../server/proto/client/skip_heat.proto",
  "../server/proto/client/defer_heat.proto",
  "../server/proto/client/modify_heats.proto",
  "../server/proto/client/end_race.proto",
  "../server/proto/client/race_subscription.proto",
  "../server/proto/client/arduino_config.proto",
  "../server/proto/client/lane_model.proto",
  "../server/proto/client/track_model.proto",
  "../server/proto/client/race_model.proto",
  "../server/proto/client/team_model.proto",
  "../server/proto/client/audio_config.proto",
  "../server/proto/server/race_state.proto",
  "../server/proto/server/asset_management_response.proto",
  "../server/proto/server/race_time.proto",
  "../server/proto/server/lap.proto",
  "../server/proto/server/race_data.proto",
  "../server/proto/server/race.proto",
  "../server/proto/server/race_participant.proto",
  "../server/proto/server/heat_data.proto",
  "../server/proto/server/heat.proto",
  "../server/proto/server/standings_update.proto",
  "../server/proto/server/overall_standings_update.proto",
  "../server/proto/server/record_data.proto",
  "../server/proto/server/demo.proto",
  "../server/proto/server/full_update.proto",
  "../server/proto/server/system_state.proto",
];

const jsOutputFile = path.join(protoOutputDir, "message.js");
const tsOutputFile = path.join(protoOutputDir, "message.d.ts");

try {
  // 1. Generate JS
  console.log("Generating message.js...");
  const pbjsCmd = `node "${pbjsPath}" -p ../server/proto -t static-module -w es6 -o "${jsOutputFile}" ${protoFiles.map((f) => `"${f}"`).join(" ")}`;
  execSync(pbjsCmd, { stdio: "inherit", cwd: path.join(__dirname, "..") });

  // 2. Generate TS definitions
  console.log("Generating message.d.ts...");
  const pbtsCmd = `node "${pbtsPath}" -o "${tsOutputFile}" "${jsOutputFile}"`;
  execSync(pbtsCmd, { stdio: "inherit", cwd: path.join(__dirname, "..") });

  console.log("Protobuf generation completed successfully!");
} catch (error) {
  console.error("Error generating protobuf files:", error);
  process.exit(1);
}
