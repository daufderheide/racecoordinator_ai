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

const serverProtoDir = path.resolve(__dirname, "..", "..", "server", "proto");
const clientProtos = fs.existsSync(path.join(serverProtoDir, "client"))
  ? fs
      .readdirSync(path.join(serverProtoDir, "client"))
      .filter((f) => f.endsWith(".proto"))
      .sort()
      .map((f) => `../server/proto/client/${f}`)
  : [];
const serverProtos = fs.existsSync(path.join(serverProtoDir, "server"))
  ? fs
      .readdirSync(path.join(serverProtoDir, "server"))
      .filter((f) => f.endsWith(".proto"))
      .sort()
      .map((f) => `../server/proto/server/${f}`)
  : [];
const rootProtos = ["../server/proto/message.proto"].filter((f) =>
  fs.existsSync(path.join(__dirname, "..", f)),
);

const protoFiles = [...clientProtos, ...serverProtos, ...rootProtos];

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
