#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

/**
 * Returns the list of directories and pattern paths eligible for cache/temp cleanup.
 * @param {string} projectRoot
 * @param {object} options
 * @returns {string[]}
 */
function getDirectoriesToClean(projectRoot, options = {}) {
  const clientDir = path.join(projectRoot, "client");
  const serverDir = path.join(projectRoot, "server");

  const targets = [
    // Client Angular compilation cache
    path.join(clientDir, ".angular", "cache"),
    // Isolated screendiff and unit test workspaces
    path.join(clientDir, ".isolated-test"),
    // Client npm cache
    path.join(clientDir, ".npm_cache"),
    // Coverage output
    path.join(clientDir, "coverage"),
    path.join(projectRoot, "coverage"),
    // Server temporary test databases and build output
    path.join(serverDir, "target_tmp"),
    path.join(serverDir, "target_test"),
  ];

  // Dynamic search for any tmp-isolated-test-* in client directory
  try {
    if (fs.existsSync(clientDir)) {
      const clientFiles = fs.readdirSync(clientDir);
      for (const file of clientFiles) {
        if (file.startsWith("tmp-isolated-test-")) {
          targets.push(path.join(clientDir, file));
        }
      }
    }
  } catch (_e) {
    // Ignore read errors
  }

  if (options.all) {
    targets.push(path.join(projectRoot, "build_cache"));
    targets.push(path.join(projectRoot, "release"));
  }

  return targets;
}

/**
 * Recursively deletes a directory or file if it exists.
 * @param {string} targetPath
 * @returns {boolean} true if existed and removed
 */
function cleanDirectory(targetPath) {
  try {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
      return true;
    }
  } catch (err) {
    console.warn(`Warning: Could not remove ${targetPath}: ${err.message}`);
  }
  return false;
}

/**
 * Cleans cache directories.
 * @param {object} options
 * @returns {{ cleaned: string[], skipped: string[] }}
 */
function cleanCaches(options = {}) {
  const projectRoot = options.projectRoot || path.resolve(__dirname, "..");
  const targets = getDirectoriesToClean(projectRoot, options);
  const cleaned = [];
  const skipped = [];

  for (const target of targets) {
    if (cleanDirectory(target)) {
      cleaned.push(target);
    } else {
      skipped.push(target);
    }
  }

  return { cleaned, skipped };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const isAll = args.includes("--all");
  console.log(
    "🧹 Cleaning compilation caches and temporary test directories...",
  );
  const result = cleanCaches({ all: isAll });

  if (result.cleaned.length > 0) {
    console.log(
      `\n✅ Removed ${result.cleaned.length} cache/temporary location(s):`,
    );
    for (const item of result.cleaned) {
      console.log(`  - ${path.relative(path.resolve(__dirname, ".."), item)}`);
    }
  } else {
    console.log("✨ All cache and temporary directories are already clean.");
  }
}

module.exports = {
  getDirectoriesToClean,
  cleanDirectory,
  cleanCaches,
};
