#!/usr/bin/env node

/**
 * Race Coordinator AI - Screendiff Commit & Change Verification Tool
 *
 * Enforces that whenever client UI components are modified, corresponding
 * screendiff snapshots (*-snapshots/*.png) or visual tests (*_screendiff_test.ts)
 * are also updated, unless explicitly bypassed for strict refactors.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// Terminal colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

/**
 * Normalizes file paths to use forward slashes.
 */
function normalizePath(filePath) {
  if (!filePath) return '';
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '');
}

/**
 * Executes a git command and returns trimmed stdout lines.
 */
function runGit(cmd) {
  try {
    const output = execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return output.split('\n').map(l => l.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Determines whether a file path is a client UI component or UI-related source file.
 */
function isUiComponentFile(filePath) {
  const norm = normalizePath(filePath);

  // Must be in the client directory
  if (!norm.startsWith('client/')) {
    return false;
  }

  // Ignore tests, test harnesses, mocks, snapshots, and temporary files
  if (
    norm.endsWith('.spec.ts') ||
    norm.endsWith('.spec.js') ||
    norm.endsWith('.spec.tsx') ||
    norm.endsWith('.spec.jsx') ||
    norm.endsWith('_screendiff_test.ts') ||
    norm.endsWith('.harness.ts') ||
    norm.endsWith('.harness.base.ts') ||
    norm.endsWith('.harness.e2e.ts') ||
    norm.includes('/testing/') ||
    norm.includes('-snapshots/') ||
    norm.endsWith('.tmp') ||
    norm.endsWith('.bak') ||
    norm.endsWith('.map') ||
    norm.endsWith('.d.ts')
  ) {
    return false;
  }

  // Ignore i18n translation files (translations do not change component visual structure)
  if (norm.startsWith('client/src/assets/i18n/') || norm.includes('/client/src/assets/i18n/')) {
    return false;
  }

  // Ignore non-UI client layer files (pure services, converters, guards, interfaces, models, proto, pipes)
  if (
    norm.startsWith('client/src/app/services/') ||
    norm.startsWith('client/src/app/converters/') ||
    norm.startsWith('client/src/app/guards/') ||
    norm.startsWith('client/src/app/interfaces/') ||
    norm.startsWith('client/src/app/models/') ||
    norm.startsWith('client/src/app/proto/') ||
    norm.startsWith('client/src/app/pipes/')
  ) {
    return false;
  }

  // Root client configuration and tooling files
  if (
    norm === 'client/package.json' ||
    norm === 'client/package-lock.json' ||
    norm === 'client/angular.json' ||
    norm === 'client/karma.conf.js' ||
    norm === 'client/playwright.config.ts' ||
    norm === 'client/stryker.config.json' ||
    norm.startsWith('client/tsconfig') ||
    norm.startsWith('client/.eslintrc')
  ) {
    return false;
  }

  // Global styling, root HTML, and root component files
  if (
    norm === 'client/src/styles.scss' ||
    norm === 'client/src/styles.css' ||
    norm === 'client/src/index.html' ||
    norm === 'client/src/app/app.component.ts' ||
    norm === 'client/src/app/app.component.html' ||
    norm === 'client/src/app/app.component.scss' ||
    norm === 'client/src/app/app.component.css'
  ) {
    return true;
  }

  // Angular component templates, styles, and logic
  if (
    norm.endsWith('.component.ts') ||
    norm.endsWith('.component.html') ||
    norm.endsWith('.component.scss') ||
    norm.endsWith('.component.css')
  ) {
    return true;
  }

  // Any files inside client/src/app/components/ (that weren't excluded above)
  if (norm.startsWith('client/src/app/components/')) {
    return true;
  }

  // UI assets (images, icons, fonts) in client/src/assets/
  if (norm.startsWith('client/src/assets/')) {
    return true;
  }

  return false;
}

/**
 * Determines whether a file path is a screendiff snapshot or visual test file.
 */
function isScreendiffFile(filePath) {
  const norm = normalizePath(filePath);

  // Screendiff snapshot image (e.g. *-snapshots/*.png)
  if (norm.includes('-snapshots/') && /\.(png|jpe?g|webp)$/i.test(norm)) {
    return true;
  }

  // Direct screendiff test definition
  if (norm.endsWith('_screendiff_test.ts')) {
    return true;
  }

  return false;
}

/**
 * Checks whether a commit message or environment variable bypasses the screendiff requirement.
 */
function isBypassCommit(commitMessage, env = process.env) {
  // 1. Environment variable bypass (useful for CI, automation, or custom scripts)
  if (env.SKIP_SCREENDIFF_CHECK === '1' || env.SKIP_SCREENDIFF === '1' || env.NO_SCREENDIFF === '1') {
    return {
      bypass: true,
      reason: 'Bypassed via environment variable (SKIP_SCREENDIFF_CHECK / SKIP_SCREENDIFF)',
    };
  }

  if (!commitMessage || typeof commitMessage !== 'string') {
    return { bypass: false, reason: null };
  }

  const trimmed = commitMessage.trim();

  // 2. Automated Git Merge commits
  if (
    trimmed.startsWith('Merge branch ') ||
    trimmed.startsWith('Merge remote-tracking branch ') ||
    trimmed.startsWith('Merge pull request ') ||
    trimmed.startsWith('Merge tag ')
  ) {
    return {
      bypass: true,
      reason: 'Bypassed for Git merge commit',
    };
  }

  // 3. Explicit commit message flags
  if (/\[(skip[- ]screendiffs?|no[- ]screendiffs?|skip[- ]visuals?|no[- ]visuals?|skip[- ]screendiff[- ]check)\]/i.test(trimmed)) {
    return {
      bypass: true,
      reason: 'Bypassed via commit message tag [skip-screendiff]',
    };
  }

  if (/\[refactor\]/i.test(trimmed)) {
    return {
      bypass: true,
      reason: 'Bypassed via commit message tag [refactor]',
    };
  }

  // 4. Conventional Commit prefixes for non-visual changes (refactor, chore, style)
  const conventionalMatch = trimmed.match(/^(refactor|chore|style)(\([^)]+\))?!?:/i);
  if (conventionalMatch) {
    const type = conventionalMatch[1].toLowerCase();
    return {
      bypass: true,
      reason: `Bypassed for conventional commit '${type}' (strict refactor/chore)`,
    };
  }

  // 5. Commit trailers (e.g. Skip-Screendiff: true)
  if (/^(skip-screendiff|skip-visual|screendiff):\s*(true|skip|yes|1)\s*$/im.test(trimmed)) {
    return {
      bypass: true,
      reason: 'Bypassed via commit trailer (Skip-Screendiff: true)',
    };
  }

  return { bypass: false, reason: null };
}

/**
 * Evaluates whether the given set of changed files satisfies screendiff requirements.
 */
function evaluateScreendiffCommitCheck({ changedFiles = [], commitMessage = '', env = process.env }) {
  const uiFilesChanged = changedFiles.filter(isUiComponentFile);
  const screendiffFilesChanged = changedFiles.filter(isScreendiffFile);

  // Case 1: No UI component files were changed
  if (uiFilesChanged.length === 0) {
    return {
      passed: true,
      uiFilesChanged: [],
      screendiffFilesChanged,
      bypassed: false,
      reason: 'No UI component files modified.',
    };
  }

  // Case 2: UI components changed and screendiff snapshots/tests were also updated
  if (screendiffFilesChanged.length > 0) {
    return {
      passed: true,
      uiFilesChanged,
      screendiffFilesChanged,
      bypassed: false,
      reason: `UI components modified with ${screendiffFilesChanged.length} screendiff snapshot(s)/test(s) updated.`,
    };
  }

  // Case 3: UI components changed but no screendiff files changed -> check bypass
  const bypass = isBypassCommit(commitMessage, env);
  if (bypass.bypass) {
    return {
      passed: true,
      uiFilesChanged,
      screendiffFilesChanged: [],
      bypassed: true,
      bypassReason: bypass.reason,
    };
  }

  // Case 4: Violation - UI components modified without screendiff changes or bypass
  const fileList = uiFilesChanged.map(f => `  - ${f}`).join('\n');
  const message = [
    `${colors.bold}${colors.red}❌ Screendiff Verification Failed:${colors.reset}`,
    `Client UI components were modified without updating screendiff snapshots or visual tests.`,
    ``,
    `${colors.bold}Modified UI component(s):${colors.reset}`,
    `${colors.yellow}${fileList}${colors.reset}`,
    ``,
    `${colors.bold}${colors.cyan}How to resolve:${colors.reset}`,
    `1. ${colors.bold}Run visual tests inside Docker to update snapshot baselines:${colors.reset}`,
    `     ./run_client_screendiff_tests.sh --changed --update-snapshots`,
    `   ${colors.gray}(or Windows: .\\run_client_screendiff_tests.ps1 --changed --update-snapshots)${colors.reset}`,
    `   Then stage the updated snapshot images with 'git add'.`,
    ``,
    `2. ${colors.bold}If this is a strict refactor with no visual UI changes, bypass this check:${colors.reset}`,
    `   - Use a conventional refactor commit message:`,
    `       git commit -m "refactor(client): simplify component logic"`,
    `   - Or add ${colors.cyan}[skip-screendiff]${colors.reset} to your commit message:`,
    `       git commit -m "fix(client): null check in component [skip-screendiff]"`,
    `   - Or set the environment variable:`,
    `       SKIP_SCREENDIFF_CHECK=1 git commit -m "..."`,
    ``,
  ].join('\n');

  return {
    passed: false,
    uiFilesChanged,
    screendiffFilesChanged: [],
    bypassed: false,
    message,
  };
}

/**
 * Main execution handler.
 */
function main() {
  const args = process.argv.slice(2);
  let commitMessage = '';
  let changedFiles = [];
  let baseRef = null;

  // Check if first arg is a commit message file (passed by Git commit-msg hook)
  if (args.length > 0 && !args[0].startsWith('-') && fs.existsSync(args[0])) {
    try {
      commitMessage = fs.readFileSync(args[0], 'utf8');
    } catch {
      commitMessage = '';
    }
    // In commit-msg hook mode, check staged changes
    changedFiles = runGit('git diff --cached --name-only');
  } else {
    for (const arg of args) {
      if (arg.startsWith('--base=')) {
        baseRef = arg.split('=')[1];
      } else if (arg.startsWith('--changed=')) {
        baseRef = arg.split('=')[1];
      } else if (arg === '--staged') {
        changedFiles = runGit('git diff --cached --name-only');
      }
    }

    if (baseRef) {
      changedFiles = runGit(`git diff --name-only ${baseRef}`);
    } else if (changedFiles.length === 0) {
      // Default: inspect staged changes
      changedFiles = runGit('git diff --cached --name-only');
    }

    // Attempt to read current HEAD commit message if available
    try {
      commitMessage = runGit('git log -1 --pretty=%B').join('\n');
    } catch {
      commitMessage = '';
    }
  }

  const result = evaluateScreendiffCommitCheck({
    changedFiles,
    commitMessage,
    env: process.env,
  });

  if (result.passed) {
    if (result.bypassed) {
      console.log(`${colors.cyan}ℹ [commit-check] ${result.bypassReason}${colors.reset}`);
    } else if (result.screendiffFilesChanged.length > 0) {
      console.log(`${colors.green}✔ [commit-check] UI components and screendiff snapshots/tests verified.${colors.reset}`);
    }
    process.exit(0);
  } else {
    console.error(result.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  isUiComponentFile,
  isScreendiffFile,
  isBypassCommit,
  evaluateScreendiffCommitCheck,
  normalizePath,
};
