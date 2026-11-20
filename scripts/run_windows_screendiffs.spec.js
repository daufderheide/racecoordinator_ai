const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  copyUpdatedSnapshots,
  getBuildKey,
  listSnapshots,
  refreshCache,
  withReportOutput,
} = require("./run_windows_screendiffs");
const { syncSnapshots } = require("./sync_snapshots");

function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rcai-visual-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function write(root, name, contents) {
  const file = path.join(root, name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, contents);
  return file;
}

test("Playwright output options stay accessible in the Windows report mount", () => {
  assert.deepEqual(
    withReportOutput(["--output", "custom results", "--", "--output=literal"]),
    [
      "--output=/report/test-results",
      "--output",
      "/report/custom results",
      "--",
      "--output=literal",
    ],
  );
  assert.deepEqual(withReportOutput(["--output=/work/old-location"]), [
    "--output=/report/test-results",
    "--output=/report/old-location",
  ]);
});

test("the build key tracks app, asset, protobuf and lockfile changes", (t) => {
  const root = fixture(t);
  const inputs = [
    "client/angular.json",
    "client/package.json",
    "client/package-lock.json",
    "client/scripts/proto-gen.js",
    "client/tsconfig.json",
    "client/tsconfig.app.json",
    "client/src/app/example.ts",
    "client/src/assets/logo.svg",
    "server/proto/message.proto",
  ];
  for (const input of inputs) write(root, input, "original");
  const initial = getBuildKey(root);

  write(root, "client/src/app/example.spec.ts", "new unit test");
  write(root, "client/src/app/example_screendiff_test.ts", "new screendiff");
  write(
    root,
    "client/src/app/example_screendiff_test.ts-snapshots/example-chromium-linux.png",
    "new snapshot",
  );
  assert.equal(getBuildKey(root), initial);

  for (const input of inputs) {
    write(root, input, "changed");
    assert.notEqual(getBuildKey(root), initial, input);
    write(root, input, "original");
  }
  fs.unlinkSync(path.join(root, "client/src/app/example.ts"));
  assert.notEqual(getBuildKey(root), initial);
});

test("a failed build or missing output cannot be reused", (t) => {
  const root = fixture(t);
  const marker = path.join(root, "marker");
  const output = write(root, "dist/index.html", "old build");
  write(root, "marker", "old key");
  assert.equal(
    refreshCache(marker, "old key", output, () => assert.fail()),
    0,
  );
  assert.equal(
    refreshCache(marker, "new key", output, () => 7),
    7,
  );
  assert.equal(fs.existsSync(marker), false);
  assert.equal(
    refreshCache(marker, "new key", output, () => 0),
    0,
  );
  assert.equal(fs.readFileSync(marker, "utf8"), "new key");
  fs.unlinkSync(output);
  assert.equal(
    refreshCache(marker, "new key", output, () => 3),
    3,
  );
});

test("snapshot export copies only new and changed Linux images", (t) => {
  const root = fixture(t);
  const source = path.join(root, "source");
  const output = path.join(root, "output");
  const snapshots = "app/example_screendiff_test.ts-snapshots";
  const name = (state, platform = "linux") =>
    `${snapshots}/${state}-chromium-${platform}.png`;
  write(source, name("unchanged"), "same");
  write(source, name("changed"), "before");
  const before = listSnapshots(source);
  write(source, name("changed"), "after");
  write(source, name("added"), "new");
  write(source, name("host", "win32"), "ignored");
  write(source, "assets/ordinary-linux.png", "ignored");

  copyUpdatedSnapshots(source, output, before);

  assert.deepEqual(fs.readdirSync(path.join(output, snapshots)).sort(), [
    "added-chromium-linux.png",
    "changed-chromium-linux.png",
  ]);
  assert.equal(
    fs.readFileSync(path.join(output, name("changed")), "utf8"),
    "after",
  );
  assert.equal(fs.existsSync(path.join(output, "assets")), false);
});

test("sync-only can resolve a screenshot in the mounted Docker report", (t) => {
  const root = fixture(t);
  const report = path.join(root, "reports");
  const client = path.join(root, "client");
  write(report, "test-results/actual.png", "new screenshot");
  const result = write(
    report,
    "pw-result.json",
    JSON.stringify({
      suites: [
        {
          specs: [
            {
              file: "example_screendiff_test.ts",
              tests: [
                {
                  status: "unexpected",
                  projectName: "chromium",
                  results: [
                    {
                      status: "failed",
                      attachments: [
                        {
                          name: "example-actual.png",
                          path: "/report/test-results/actual.png",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }),
  );

  const synced = syncSnapshots({
    projectRoot: client,
    isolatedDir: report,
    reportPath: result,
  });

  assert.equal(synced.success, true);
  assert.deepEqual(synced.syncedFiles, [
    path.join(
      client,
      "src/app/example_screendiff_test.ts-snapshots/example-chromium-linux.png",
    ),
  ]);
  assert.equal(
    fs.readFileSync(synced.syncedFiles[0], "utf8"),
    "new screenshot",
  );
});
