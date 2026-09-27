const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const distPath = path.join(__dirname, "../dist/client");

if (!fs.existsSync(distPath)) {
  console.log("Build output not found. Running ng build...");
  try {
    execSync("npm run build", { stdio: "inherit" });
  } catch (e) {
    console.error("Failed to run ng build", e);
    process.exit(1);
  }
}

console.log("Starting sirv...");
const isWin = process.platform === "win32";
const sirvProcess = spawn(
  isWin ? "npx.cmd" : "npx",
  ["sirv", "dist/client", "--port", "4250", "--host", "127.0.0.1", "--single"],
  { stdio: "inherit" },
);

function shutdown() {
  if (sirvProcess && !sirvProcess.killed) {
    sirvProcess.kill("SIGTERM");
  }
}

process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});

sirvProcess.on("exit", (code) => {
  process.exit(code ?? 0);
});
