const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const distPath = path.join(__dirname, "../dist/client");
const indexPath = path.join(distPath, "index.html");

if (!fs.existsSync(distPath) || !fs.existsSync(indexPath)) {
  console.log(
    "Build output not found or missing index.html. Running ng build...",
  );
  try {
    execSync("npm run build", { stdio: "inherit" });
  } catch (e) {
    console.error("Failed to run ng build", e);
    process.exit(1);
  }
}

console.log("Starting sirv...");
let sirvBin;
try {
  const sirvPkg = require.resolve("sirv-cli/package.json");
  sirvBin = path.join(path.dirname(sirvPkg), "bin.js");
} catch {
  sirvBin = path.join(__dirname, "../node_modules/sirv-cli/bin.js");
}

const isWin = process.platform === "win32";
const sirvProcess = fs.existsSync(sirvBin)
  ? spawn(
      process.execPath,
      [
        sirvBin,
        "dist/client",
        "--port",
        "4250",
        "--host",
        "127.0.0.1",
        "--single",
      ],
      { stdio: "inherit" },
    )
  : spawn(
      isWin ? "npx.cmd" : "npx",
      [
        "sirv",
        "dist/client",
        "--port",
        "4250",
        "--host",
        "127.0.0.1",
        "--single",
      ],
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
  if (code !== 0 && code !== null) {
    console.error(`sirv exited with code ${code}`);
    process.exit(code);
  }
  process.exit(0);
});
