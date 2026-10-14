const { test, describe } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const os = require("os");
const {
  getDirectoriesToClean,
  cleanDirectory,
  cleanCaches,
} = require("./clean_cache");

describe("clean_cache", () => {
  test("getDirectoriesToClean should return standard cache and temp directories", () => {
    const mockRoot = path.join(os.tmpdir(), "clean-cache-test-root");
    const targets = getDirectoriesToClean(mockRoot);

    assert.ok(
      targets.some((t) => t.endsWith(path.join("client", ".angular", "cache"))),
    );
    assert.ok(
      targets.some((t) => t.endsWith(path.join("client", ".isolated-test"))),
    );
    assert.ok(
      targets.some((t) => t.endsWith(path.join("server", "target_tmp"))),
    );
    assert.ok(
      targets.some((t) => t.endsWith(path.join("server", "target_test"))),
    );
    assert.ok(
      !targets.some((t) => t.endsWith("release")),
      "Should not include release by default",
    );
    assert.ok(
      !targets.some((t) => t.endsWith("build_cache")),
      "Should not include build_cache by default",
    );
  });

  test("getDirectoriesToClean with options.all should include release and build_cache", () => {
    const mockRoot = path.join(os.tmpdir(), "clean-cache-test-root-all");
    const targets = getDirectoriesToClean(mockRoot, { all: true });

    assert.ok(targets.some((t) => t.endsWith("release")));
    assert.ok(targets.some((t) => t.endsWith("build_cache")));
  });

  test("getDirectoriesToClean should dynamically discover tmp-isolated-test-* directories", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "clean-cache-tmp-"));
    try {
      const clientDir = path.join(tempDir, "client");
      fs.mkdirSync(clientDir, { recursive: true });
      fs.mkdirSync(path.join(clientDir, "tmp-isolated-test-501"));
      fs.mkdirSync(path.join(clientDir, "tmp-isolated-test-1000"));
      fs.mkdirSync(path.join(clientDir, "src"));

      const targets = getDirectoriesToClean(tempDir);
      assert.ok(targets.some((t) => t.endsWith("tmp-isolated-test-501")));
      assert.ok(targets.some((t) => t.endsWith("tmp-isolated-test-1000")));
      assert.ok(!targets.some((t) => t.endsWith("src")));
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test("cleanDirectory should delete existing directories and return true", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "clean-dir-test-"));
    const target = path.join(tempDir, "to-delete");
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, "dummy.txt"), "hello");

    assert.ok(fs.existsSync(target));
    const result = cleanDirectory(target);
    assert.strictEqual(result, true);
    assert.strictEqual(fs.existsSync(target), false);
  });

  test("cleanDirectory should return false for non-existent paths without error", () => {
    const nonExistent = path.join(
      os.tmpdir(),
      "non-existent-clean-target-" + Date.now(),
    );
    const result = cleanDirectory(nonExistent);
    assert.strictEqual(result, false);
  });

  test("cleanCaches should clean matching directories and report status", () => {
    const tempRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), "clean-caches-test-"),
    );
    try {
      const clientDir = path.join(tempRoot, "client");
      const cacheDir = path.join(clientDir, ".angular", "cache");
      fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(path.join(cacheDir, "cache.json"), "{}");

      const { cleaned, skipped } = cleanCaches({ projectRoot: tempRoot });
      assert.ok(cleaned.some((c) => c === cacheDir));
      assert.strictEqual(fs.existsSync(cacheDir), false);
      assert.ok(skipped.length > 0);
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true });
    }
  });
});
