const fs = require('fs');
const path = require('path');

function findFailedSpecs(node) {
    if (!node) return [];
    let failed = [];
    if (node.specs) {
        for (const spec of node.specs) {
            const hasFailure = spec.tests && spec.tests.some(t => t.status === 'unexpected' || t.status === 'failed');
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

function syncSnapshots(options = {}) {
    const projectRoot = options.projectRoot || process.env.CLIENT_DIR || path.resolve(__dirname, '..', 'client');
    const reportPath = options.reportPath || process.env.PW_REPORT_PATH || path.join(projectRoot, 'pw-result.json');
    const isolatedDir = options.isolatedDir || process.env.ISOLATED_DIR || path.join(projectRoot, '.isolated-test');

    if (!fs.existsSync(reportPath)) {
        console.error(`Error: Report file not found at ${reportPath}`);
        return { success: false, syncedFiles: [], error: 'Report file not found' };
    }

    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const failedSpecs = findFailedSpecs(report);

    if (failedSpecs.length === 0) {
        console.log("No failed/unexpected tests found in the report. Nothing to sync.");
        return { success: true, syncedFiles: [] };
    }

    console.log(`Found ${failedSpecs.length} specs with failures. Syncing snapshots...`);
    const syncedFiles = [];

    for (const spec of failedSpecs) {
        const relativeTestFile = spec.file; // e.g. components/track-editor/...
        if (!relativeTestFile) continue;

        const snapshotDir = path.join(projectRoot, 'src', 'app', `${relativeTestFile}-snapshots`);
        if (!fs.existsSync(snapshotDir)) {
            fs.mkdirSync(snapshotDir, { recursive: true });
        }

        for (const test of spec.tests) {
            if (test.status !== 'unexpected' && test.status !== 'failed') continue;
            const projectName = test.projectName || test.projectId || 'chromium';
            for (const result of (test.results || [])) {
                if (result.status !== 'unexpected' && result.status !== 'failed') continue;

                const attachments = result.attachments || [];
                for (const attachment of attachments) {
                    if (attachment.name.endsWith('-actual.png')) {
                        let actualPath = attachment.path;
                        // If the path is from the Docker container, map it back to the host filesystem
                        if (actualPath.startsWith('/work/')) {
                            actualPath = actualPath.replace('/work', isolatedDir);
                        }

                        if (!fs.existsSync(actualPath)) {
                            console.log(`Warning: Actual file not found on disk: ${actualPath}`);
                            continue;
                        }

                        const snapshotBaseName = attachment.name.replace('-actual.png', '');
                        // Find matching expected file in snapshot folder
                        const files = fs.readdirSync(snapshotDir);
                        const matchingFiles = files.filter(f =>
                            (f === `${snapshotBaseName}-${projectName}-linux.png` ||
                             f === `${snapshotBaseName}-${projectName}.png` ||
                             f.startsWith(`${snapshotBaseName}-${projectName}-`)) &&
                            f.endsWith('.png')
                        );

                        if (matchingFiles.length === 0) {
                            const targetName = `${snapshotBaseName}-${projectName}-linux.png`;
                            const destPath = path.join(snapshotDir, targetName);
                            fs.copyFileSync(actualPath, destPath);
                            console.log(`✅ Created new snapshot: ${targetName}`);
                            syncedFiles.push(destPath);
                            continue;
                        }

                        for (const match of matchingFiles) {
                            const destPath = path.join(snapshotDir, match);
                            fs.copyFileSync(actualPath, destPath);
                            console.log(`✅ Synced: ${match}`);
                            syncedFiles.push(destPath);
                        }
                    }
                }
            }
        }
    }

    console.log("Snapshot sync complete.");
    return { success: true, syncedFiles };
}

if (require.main === module) {
    const result = syncSnapshots();
    if (!result.success) {
        process.exit(1);
    }
}

module.exports = {
    findFailedSpecs,
    syncSnapshots
};
