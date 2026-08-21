const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CLIENT_DIR = path.join(PROJECT_ROOT, 'client');
const APP_DIR = path.join(CLIENT_DIR, 'src', 'app');

/**
 * Core shared components that are embedded in nearly every manager / editor screen.
 * Changes to these components visually alter almost all screenshots across the app.
 */
const CORE_SHARED_COMPONENTS = [
    'toolbar',
    'manager-header',
    'editor-title',
    'undo-redo-controls'
];

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
 * Recursively find all files matching *_screendiff_test.ts in a directory.
 */
function findScreendiffTestsInDir(dirPath) {
    if (!fs.existsSync(dirPath)) return [];
    let results = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            // Skip node_modules and snapshots
            if (entry.name === 'node_modules' || entry.name.endsWith('-snapshots')) continue;
            results = results.concat(findScreendiffTestsInDir(fullPath));
        } else if (entry.isFile() && entry.name.endsWith('_screendiff_test.ts')) {
            results.push(fullPath);
        }
    }
    return results;
}

/**
 * Find all screendiff tests in the entire app.
 */
function findAllScreendiffTests() {
    return findScreendiffTestsInDir(APP_DIR);
}

/**
 * Get list of changed file paths from git.
 * Detects:
 * 1. All changes on current branch compared to main/master (using merge-base `origin/main...`)
 * 2. All unpushed commits compared to upstream (@{u})
 * 3. All uncommitted working tree changes (staged + unstaged)
 * 4. All untracked new files
 * 5. Fallback to HEAD~1 if working tree and main are identical
 */
function getChangedFiles(baseRef) {
    const changedFiles = new Set();

    if (baseRef) {
        // Compare against specific git ref
        const diffFiles = runGit(`git diff --name-only ${baseRef}`);
        diffFiles.forEach(f => changedFiles.add(f));
        return Array.from(changedFiles);
    }

    // 1. Check all changes on current branch compared to origin/develop, origin/main, or origin/master merge-base
    let baseDiff = runGit('git diff --name-only origin/develop...');
    if (baseDiff.length === 0) {
        baseDiff = runGit('git diff --name-only origin/main...');
    }
    if (baseDiff.length === 0) {
        baseDiff = runGit('git diff --name-only origin/master...');
    }
    if (baseDiff.length === 0) {
        baseDiff = runGit('git diff --name-only @{u}');
    }
    baseDiff.forEach(f => changedFiles.add(f));

    // 2. Unstaged changes in working tree
    runGit('git diff --name-only').forEach(f => changedFiles.add(f));

    // 3. Staged changes in index
    runGit('git diff --cached --name-only').forEach(f => changedFiles.add(f));

    // 4. Untracked new files
    runGit('git ls-files --others --exclude-standard').forEach(f => changedFiles.add(f));

    // 5. If working tree is completely clean and already merged with main, fallback to last commit changes
    if (changedFiles.size === 0) {
        runGit('git diff --name-only HEAD~1').forEach(f => changedFiles.add(f));
    }

    return Array.from(changedFiles);
}

/**
 * Resolves a changed file to relevant screendiff test files.
 */
function resolveTestsForFile(filePath) {
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(PROJECT_ROOT, filePath);
    const normalized = fullPath.replace(/\\/g, '/');

    // 0. Ignore translation files (i18n/*.json) - component changes drive their own screendiff tests
    if (normalized.includes('/client/src/assets/i18n/')) {
        return [];
    }

    // 1. Global styling, index.html, root component, or global assets (images, fonts)
    if (
        normalized.endsWith('/client/src/styles.scss') ||
        normalized.endsWith('/client/src/styles.css') ||
        normalized.endsWith('/client/src/index.html') ||
        normalized.endsWith('/client/src/app/app.component.html') ||
        normalized.endsWith('/client/src/app/app.component.ts') ||
        normalized.includes('/client/src/assets/')
    ) {
        console.error(`Note: Global asset/style changed (${path.relative(PROJECT_ROOT, fullPath)}). Running all visual tests.`);
        return findAllScreendiffTests();
    }

    // 2. Core shared components used across all managers/editors (toolbar, manager-header, editor-title, etc.)
    for (const coreComp of CORE_SHARED_COMPONENTS) {
        if (normalized.includes(`/client/src/app/components/shared/${coreComp}/`)) {
            console.error(`Note: Core shared component changed (${coreComp}). Running all visual tests.`);
            return findAllScreendiffTests();
        }
    }

    // 3. If the file is directly a screendiff test file
    if (normalized.endsWith('_screendiff_test.ts') && fs.existsSync(fullPath)) {
        return [fullPath];
    }

    // Only process client/src/app files for component-scoped testing
    if (!normalized.includes('/client/src/app/')) {
        return [];
    }

    let currentDir = fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory() 
        ? fullPath 
        : path.dirname(fullPath);

    // Search current directory and all subdirectories
    let tests = findScreendiffTestsInDir(currentDir);
    if (tests.length > 0) {
        return tests;
    }

    // Walk up parent directories up to client/src/app
    const appDirNormalized = APP_DIR.replace(/\\/g, '/');
    while (currentDir && currentDir.replace(/\\/g, '/').startsWith(appDirNormalized) && currentDir.replace(/\\/g, '/') !== appDirNormalized) {
        currentDir = path.dirname(currentDir);
        tests = findScreendiffTestsInDir(currentDir);
        if (tests.length > 0) {
            return tests;
        }
    }

    return [];
}

function main() {
    const args = process.argv.slice(2);
    let baseRef = null;
    for (const arg of args) {
        if (arg.startsWith('--base=')) {
            baseRef = arg.split('=')[1];
        } else if (arg.startsWith('--changed=')) {
            baseRef = arg.split('=')[1];
        }
    }

    const changedFiles = getChangedFiles(baseRef);
    if (changedFiles.length === 0) {
        process.exit(0);
    }

    const matchedTests = new Set();
    for (const file of changedFiles) {
        const tests = resolveTestsForFile(file);
        for (const test of tests) {
            matchedTests.add(test);
        }
    }

    const testList = Array.from(matchedTests);
    if (testList.length === 0) {
        process.exit(0);
    }

    // Convert absolute paths to paths relative to client/ (e.g. src/app/components/.../foo_screendiff_test.ts)
    const relativeTests = testList.map(t => {
        const rel = path.relative(CLIENT_DIR, t).replace(/\\/g, '/');
        return rel;
    });

    console.log(relativeTests.join(' '));
}

if (require.main === module) {
    main();
}

module.exports = {
    getChangedFiles,
    resolveTestsForFile,
    findScreendiffTestsInDir,
    findAllScreendiffTests
};
