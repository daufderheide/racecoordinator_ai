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
 * Recursively search for files containing a specific string (used for reverse dependency lookups).
 */
function findFilesContainingString(dirPath, searchString) {
    if (!fs.existsSync(dirPath)) return [];
    let results = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            // Skip node_modules, snapshots, and hidden directories
            if (entry.name === 'node_modules' || entry.name.endsWith('-snapshots') || entry.name.startsWith('.')) continue;
            results = results.concat(findFilesContainingString(fullPath, searchString));
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.html'))) {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.includes(searchString)) {
                    results.push(fullPath);
                }
            } catch (e) {
                // Ignore read errors
            }
        }
    }
    return results;
}

/**
 * Resolves screendiff tests by recursively finding files that import/depend on the target file.
 */
function resolveTestsByReverseDependency(filePath, visited = new Set()) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    if (visited.has(normalizedPath)) return [];
    visited.add(normalizedPath);

    let currentDir = fs.existsSync(filePath) && fs.statSync(filePath).isDirectory() 
        ? filePath 
        : path.dirname(filePath);

    // 1. Search current directory and all subdirectories
    let tests = findScreendiffTestsInDir(currentDir);
    if (tests.length > 0) {
        return tests;
    }

    // 2. If no tests found, find dependents (files that import this file)
    const ext = path.extname(filePath);
    const basename = path.basename(filePath, ext);
    
    // Ignore extremely common or short names to avoid full-app false-positive searches
    if (basename === 'index' || basename === 'module' || basename.length <= 3) {
        return [];
    }

    console.error(`Note: No direct tests for ${path.basename(filePath)}. Resolving reverse dependencies...`);
    const dependents = findFilesContainingString(APP_DIR, basename);
    
    let allTests = [];
    for (const dep of dependents) {
        if (dep.replace(/\\/g, '/') === normalizedPath) continue;
        const depTests = resolveTestsByReverseDependency(dep, visited);
        allTests = allTests.concat(depTests);
    }
    
    return allTests;
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

    // 0b. Sample widgets are rendered by custom widget components in UI Editor and Raceday
    if (normalized.includes('/client/src/assets/sample-widgets/')) {
        return [
            ...findScreendiffTestsInDir(path.join(APP_DIR, 'components', 'ui-editor')),
            ...findScreendiffTestsInDir(path.join(APP_DIR, 'components', 'raceday'))
        ];
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

    // Only process client/src/app/components files for component-scoped testing.
    // Non-UI layers (models, services, converters, pipes, utils, guards, interfaces, proto, race, testing)
    // are logic/data layers that do not directly define visual rendering.
    if (!normalized.includes('/client/src/app/components/')) {
        return [];
    }

    // Use reverse dependency resolution to find tests that depend on this file
    return resolveTestsByReverseDependency(fullPath);
}

function main() {
    const args = process.argv.slice(2);
    if (args.includes('--count-all')) {
        const allTests = findAllScreendiffTests();
        console.log(allTests.length);
        process.exit(0);
    }

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
