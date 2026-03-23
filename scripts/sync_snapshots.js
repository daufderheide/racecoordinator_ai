const fs = require('fs');
const path = require('path');

const REPORT_PATH = '/tmp/pw-result.json';
const PROJECT_ROOT = process.env.CLIENT_DIR || path.resolve(__dirname, 'client');

function findFailedSpecs(node) {
    if (!node) return [];
    let failed = [];
    if (node.specs) {
        for (const spec of node.specs) {
            const hasFailure = spec.tests && spec.tests.some(t => t.status === 'failed' || (t.results && t.results.some(r => r.status === 'failed' || r.status === 'unexpected')));
            if (hasFailure) {
                failed.push(spec);
            }
        }
    }
    if (node.suites) {
        for (const suite of node.suites) {
            failed = failed.concat(findFailedSpecs(suite));
        }
    }
    return failed;
}

if (!fs.existsSync(REPORT_PATH)) {
    console.error(`Error: Report file not found at ${REPORT_PATH}`);
    process.exit(1);
}

const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf8'));
const failedSpecs = findFailedSpecs(report);

if (failedSpecs.length === 0) {
    console.log("No failed/unexpected tests found in the report. Nothing to sync.");
    process.exit(0);
}

console.log(`Found ${failedSpecs.length} specs with failures. Syncing snapshots...`);

for (const spec of failedSpecs) {
    const relativeTestFile = spec.file; // e.g. components/track-editor/...
    if (!relativeTestFile) continue;

    const snapshotDir = path.join(PROJECT_ROOT, 'src', 'app', `${relativeTestFile}-snapshots`);
    if (!fs.existsSync(snapshotDir)) {
         console.log(`Warning: Snapshot directory not found: ${snapshotDir}`);
         continue;
    }

    for (const test of spec.tests) {
        const projectName = test.projectName || test.projectId || 'chromium';
        for (const result of (test.results || [])) {
            if (result.status !== 'unexpected' && result.status !== 'failed') continue;

            const attachments = result.attachments || [];
            for (const attachment of attachments) {
                if (attachment.name.endsWith('-actual.png')) {
                    const actualPath = attachment.path;
                    if (!fs.existsSync(actualPath)) {
                        console.log(`Warning: Actual file not found on disk: ${actualPath}`);
                        continue;
                    }

                    const snapshotBaseName = attachment.name.replace('-actual.png', '');
                    // Find matching expected file in snapshot folder
                    const files = fs.readdirSync(snapshotDir);
                    const matchingFiles = files.filter(f => f.startsWith(snapshotBaseName) && f.includes(projectName) && f.endsWith('.png'));

                    if (matchingFiles.length === 0) {
                        console.log(`Could not find expected file for snapshot: ${snapshotBaseName} in ${snapshotDir}`);
                        continue;
                    }

                    for (const match of matchingFiles) {
                         const destPath = path.join(snapshotDir, match);
                         fs.copyFileSync(actualPath, destPath);
                         console.log(`✅ Synced: ${match}`);
                    }
                }
            }
        }
    }
}

console.log("Snapshot sync complete.");
