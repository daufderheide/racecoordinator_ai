const { createHash } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function hashInputs(root, entries, skip = () => false) {
  const hash = createHash("sha256").update(process.version);

  function visit(relativePath) {
    if (skip(relativePath)) return;
    const fullPath = path.join(root, relativePath);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(fullPath).sort()) {
        visit(path.posix.join(relativePath, name));
      }
    } else {
      const contents = fs.readFileSync(fullPath);
      hash.update(`${relativePath}\0${contents.length}\0`).update(contents);
    }
  }

  for (const entry of entries) visit(entry);
  return hash.digest("hex");
}

function isTestOnlyInput(relativePath) {
  return (
    relativePath.startsWith("client/src/app/") &&
    (relativePath.endsWith(".spec.ts") ||
      relativePath.endsWith("_screendiff_test.ts") ||
      relativePath.split("/").some((segment) => segment.endsWith("-snapshots")))
  );
}

function getBuildKey(checkout) {
  return hashInputs(
    checkout,
    [
      "client/angular.json",
      "client/package.json",
      "client/package-lock.json",
      "client/scripts/proto-gen.js",
      "client/tsconfig.json",
      "client/tsconfig.app.json",
      "client/src",
      "server/proto",
    ],
    isTestOnlyInput,
  );
}

function listSnapshots(source, relativePath = "") {
  const snapshots = new Map();
  for (const item of fs.readdirSync(path.join(source, relativePath), {
    withFileTypes: true,
  })) {
    const relative = path.join(relativePath, item.name);
    if (item.isDirectory()) {
      for (const [name, digest] of listSnapshots(source, relative)) {
        snapshots.set(name, digest);
      }
    } else if (
      item.isFile() &&
      item.name.endsWith("-linux.png") &&
      relative.split(path.sep).some((segment) => segment.endsWith("-snapshots"))
    ) {
      const contents = fs.readFileSync(path.join(source, relative));
      snapshots.set(
        relative,
        createHash("sha256").update(contents).digest("hex"),
      );
    }
  }
  return snapshots;
}

function copyUpdatedSnapshots(source, destination, before) {
  for (const [relativePath, digest] of listSnapshots(source)) {
    if (before.get(relativePath) === digest) continue;
    const target = path.join(destination, relativePath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(source, relativePath), target);
  }
}

function run(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function refreshCache(marker, key, output, prepare) {
  if (
    fs.existsSync(output) &&
    fs.existsSync(marker) &&
    fs.readFileSync(marker, "utf8") === key
  ) {
    return 0;
  }
  fs.rmSync(marker, { force: true });
  const status = prepare();
  if (status === 0) fs.writeFileSync(marker, key);
  return status;
}

function withReportOutput(args) {
  const mapOutput = (output) =>
    output.startsWith("/work/")
      ? path.posix.join("/report", output.slice("/work/".length))
      : path.posix.resolve("/report", output);
  const optionEnd = args.indexOf("--");
  const mapped = args.map((arg, index) => {
    if (optionEnd >= 0 && index >= optionEnd) return arg;
    if (arg.startsWith("--output=")) {
      return "--output=" + mapOutput(arg.slice("--output=".length));
    }
    return args[index - 1] === "--output" ? mapOutput(arg) : arg;
  });
  return ["--output=/report/test-results", ...mapped];
}

function main(args) {
  const cache = "/work";
  const report = "/report";
  const checkout = path.join(cache, "checkout");
  const client = path.join(checkout, "client");
  const deps = path.join(cache, "dependencies");
  const dist = path.join(cache, "dist");
  const angularCache = path.join(cache, "angular-cache");
  const snapshotOutput = path.join(report, "updated-snapshots");

  // Restore a clean source tree while keeping dependencies, Angular cache, and build output on Linux.
  fs.rmSync(checkout, { recursive: true, force: true });
  fs.rmSync(snapshotOutput, { recursive: true, force: true });
  fs.rmSync(path.join(report, "pw-result.json"), { force: true });
  fs.mkdirSync(checkout);
  let status = run("tar", ["-xf", "/inputs.tar", "-C", checkout], cache);
  if (status !== 0) return status;

  const buildKey = getBuildKey(checkout);
  fs.mkdirSync(deps, { recursive: true });
  const dependencyKey = hashInputs(client, [
    "package.json",
    "package-lock.json",
  ]);
  status = refreshCache(
    path.join(deps, "install-key"),
    dependencyKey,
    path.join(deps, "node_modules/@playwright/test/cli.js"),
    () => {
      console.log("Installing locked dependencies in the Docker volume...");
      for (const name of ["package.json", "package-lock.json"]) {
        fs.copyFileSync(path.join(client, name), path.join(deps, name));
      }
      return run(
        "npm",
        [
          "ci",
          "--legacy-peer-deps",
          "--ignore-scripts",
          "--no-audit",
          "--no-fund",
          "--cache",
          path.join(cache, "npm-cache"),
        ],
        deps,
      );
    },
  );
  if (status !== 0) return status;

  fs.mkdirSync(angularCache, { recursive: true });
  fs.symlinkSync(
    path.join(deps, "node_modules"),
    path.join(client, "node_modules"),
  );
  fs.symlinkSync(angularCache, path.join(client, ".angular"));
  fs.symlinkSync(dist, path.join(client, "dist"));
  status = run(process.execPath, ["scripts/proto-gen.js"], client);
  if (status !== 0) return status;

  if (!args.includes("--list")) {
    let rebuilt = false;
    status = refreshCache(
      path.join(cache, "build-key"),
      buildKey,
      path.join(dist, "client/index.html"),
      () => {
        rebuilt = true;
        console.log("Building the client in Docker...");
        // Build before Playwright starts timing the web server.
        // Angular's default cache is local-only. Keep Playwright in CI mode.
        const buildEnv = { ...process.env };
        delete buildEnv.CI;
        return run(
          "npm",
          ["run", "build", "--", "--output-path", path.join(dist, "client")],
          client,
          buildEnv,
        );
      },
    );
    if (status !== 0) return status;
    if (!rebuilt) console.log("Reusing the client build for these inputs.");
  }

  const update = args.some(
    (arg) =>
      arg === "-u" ||
      arg === "--update-snapshots" ||
      (arg.startsWith("--update-snapshots=") &&
        arg !== "--update-snapshots=none"),
  );
  const source = path.join(client, "src");
  const before = update ? listSnapshots(source) : undefined;
  status = run(
    process.execPath,
    ["node_modules/@playwright/test/cli.js", "test", ...withReportOutput(args)],
    client,
    {
      ...process.env,
      PW_REPORT_PATH: path.join(report, "pw-result.json"),
      PLAYWRIGHT_HTML_OUTPUT_DIR: path.join(report, "playwright-report"),
    },
  );
  if (status === 0 && before)
    copyUpdatedSnapshots(source, snapshotOutput, before);
  return status;
}

if (require.main === module) {
  try {
    process.exitCode = main(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  getBuildKey,
  refreshCache,
  listSnapshots,
  copyUpdatedSnapshots,
  withReportOutput,
};
