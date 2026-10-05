const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { findFailedSpecs, syncSnapshots } = require('./sync_snapshots');

describe('sync_snapshots', () => {
    describe('findFailedSpecs', () => {
        it('should return empty array for empty or null input', () => {
            assert.deepStrictEqual(findFailedSpecs(null), []);
            assert.deepStrictEqual(findFailedSpecs({}), []);
        });

        it('should ignore passed tests and flaky tests', () => {
            const report = {
                suites: [
                    {
                        specs: [
                            {
                                file: 'test1.ts',
                                tests: [{ status: 'expected' }]
                            },
                            {
                                file: 'test2.ts',
                                tests: [{ status: 'flaky', results: [{ status: 'failed' }, { status: 'passed' }] }]
                            },
                            {
                                file: 'test3.ts',
                                tests: [{ status: 'skipped' }]
                            }
                        ]
                    }
                ]
            };
            const failed = findFailedSpecs(report);
            assert.strictEqual(failed.length, 0);
        });

        it('should find specs with unexpected or failed test status', () => {
            const report = {
                suites: [
                    {
                        specs: [
                            {
                                file: 'test1.ts',
                                tests: [{ status: 'unexpected' }]
                            }
                        ],
                        suites: [
                            {
                                specs: [
                                    {
                                        file: 'test2.ts',
                                        tests: [{ status: 'failed' }]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };
            const failed = findFailedSpecs(report);
            assert.strictEqual(failed.length, 2);
            assert.strictEqual(failed[0].file, 'test1.ts');
            assert.strictEqual(failed[1].file, 'test2.ts');
        });
    });

    describe('syncSnapshots', () => {
        let tempDir;
        let projectRoot;
        let isolatedDir;
        let reportPath;

        beforeEach(() => {
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-snap-test-'));
            projectRoot = path.join(tempDir, 'client');
            isolatedDir = path.join(projectRoot, '.isolated-test');
            reportPath = path.join(isolatedDir, 'pw-result.json');

            fs.mkdirSync(isolatedDir, { recursive: true });
        });

        afterEach(() => {
            fs.rmSync(tempDir, { recursive: true, force: true });
        });

        it('should fail gracefully if report file does not exist', () => {
            const result = syncSnapshots({
                projectRoot,
                isolatedDir,
                reportPath: path.join(tempDir, 'non-existent.json')
            });
            assert.strictEqual(result.success, false);
            assert.strictEqual(result.error, 'Report file not found');
        });

        it('should succeed with empty array when no failed specs', () => {
            fs.writeFileSync(reportPath, JSON.stringify({ suites: [] }));
            const result = syncSnapshots({ projectRoot, isolatedDir, reportPath });
            assert.strictEqual(result.success, true);
            assert.deepStrictEqual(result.syncedFiles, []);
        });

        it('should sync unexpected failed snapshots and ignore flaky tests', () => {
            // Setup actual images in isolatedDir
            const actualDir = path.join(isolatedDir, 'test-results', 'spec1');
            fs.mkdirSync(actualDir, { recursive: true });
            const actualImg1 = path.join(actualDir, 'my-card-actual.png');
            fs.writeFileSync(actualImg1, 'NEW_ACTUAL_PIXELS');

            // Setup existing snapshot directory
            const snapshotDir = path.join(projectRoot, 'src', 'app', 'components', 'spec1.ts-snapshots');
            fs.mkdirSync(snapshotDir, { recursive: true });
            const expectedImg = path.join(snapshotDir, 'my-card-webkit-linux.png');
            fs.writeFileSync(expectedImg, 'OLD_EXPECTED_PIXELS');

            const report = {
                suites: [
                    {
                        specs: [
                            {
                                file: 'components/spec1.ts',
                                tests: [
                                    {
                                        projectName: 'webkit',
                                        status: 'unexpected',
                                        results: [
                                            {
                                                status: 'unexpected',
                                                attachments: [
                                                    {
                                                        name: 'my-card-actual.png',
                                                        path: '/work/test-results/spec1/my-card-actual.png'
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                file: 'components/flaky-spec.ts',
                                tests: [
                                    {
                                        projectName: 'webkit',
                                        status: 'flaky',
                                        results: [
                                            {
                                                status: 'failed',
                                                attachments: [
                                                    {
                                                        name: 'flaky-card-actual.png',
                                                        path: '/work/test-results/spec1/flaky-card-actual.png'
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };
            fs.writeFileSync(reportPath, JSON.stringify(report));

            const result = syncSnapshots({ projectRoot, isolatedDir, reportPath });
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.syncedFiles.length, 1);
            assert.strictEqual(result.syncedFiles[0], expectedImg);
            assert.strictEqual(fs.readFileSync(expectedImg, 'utf8'), 'NEW_ACTUAL_PIXELS');
        });

        it('should create new snapshot file when matching expected file does not exist', () => {
            const actualDir = path.join(isolatedDir, 'test-results', 'spec2');
            fs.mkdirSync(actualDir, { recursive: true });
            const actualImg = path.join(actualDir, 'new-feature-actual.png');
            fs.writeFileSync(actualImg, 'FRESH_SNAPSHOT');

            const report = {
                suites: [
                    {
                        specs: [
                            {
                                file: 'components/spec2.ts',
                                tests: [
                                    {
                                        projectName: 'chromium',
                                        status: 'failed',
                                        results: [
                                            {
                                                status: 'failed',
                                                attachments: [
                                                    {
                                                        name: 'new-feature-actual.png',
                                                        path: actualImg
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };
            fs.writeFileSync(reportPath, JSON.stringify(report));

            const result = syncSnapshots({ projectRoot, isolatedDir, reportPath });
            assert.strictEqual(result.success, true);
            const createdSnapshot = path.join(projectRoot, 'src', 'app', 'components', 'spec2.ts-snapshots', 'new-feature-chromium-linux.png');
            assert.strictEqual(fs.existsSync(createdSnapshot), true);
            assert.strictEqual(fs.readFileSync(createdSnapshot, 'utf8'), 'FRESH_SNAPSHOT');
        });

        it('should skip gracefully if actual file is missing on disk', () => {
            const report = {
                suites: [
                    {
                        specs: [
                            {
                                file: 'components/spec3.ts',
                                tests: [
                                    {
                                        projectName: 'webkit',
                                        status: 'unexpected',
                                        results: [
                                            {
                                                status: 'unexpected',
                                                attachments: [
                                                    {
                                                        name: 'ghost-actual.png',
                                                        path: path.join(isolatedDir, 'ghost-actual.png')
                                                    }
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            };
            fs.writeFileSync(reportPath, JSON.stringify(report));

            const result = syncSnapshots({ projectRoot, isolatedDir, reportPath });
            assert.strictEqual(result.success, true);
            assert.strictEqual(result.syncedFiles.length, 0);
        });
    });
});
