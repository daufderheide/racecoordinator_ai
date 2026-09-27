const fs = require('fs');
const path = require('path');
const parser = require('@typescript-eslint/parser');

function findScreendiffFiles(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'node_modules' && !entry.name.endsWith('-snapshots') && !entry.name.startsWith('.')) {
                results = results.concat(findScreendiffFiles(fullPath));
            }
        } else if (entry.name.endsWith('_screendiff_test.ts')) {
            results.push(fullPath);
        }
    }
    return results;
}

function traverse(node, visitor) {
    if (!node || typeof node !== 'object') return;
    visitor(node);
    for (const key in node) {
        if (key === 'parent' || key === 'tokens' || key === 'comments') continue;
        const child = node[key];
        if (Array.isArray(child)) {
            for (const item of child) {
                traverse(item, visitor);
            }
        } else if (child && typeof child === 'object' && child.type) {
            traverse(child, visitor);
        }
    }
}

function auditScreendiffCode(code, filename = 'test.ts') {
    const ast = parser.parse(code, {
        ecmaVersion: 2022,
        sourceType: 'module',
        loc: true,
        range: true,
    });

    const testCases = [];
    const violations = [];

    traverse(ast, (node) => {
        if (node.type === 'CallExpression') {
            let isTestCall = false;
            let testTitle = 'unknown';

            if (node.callee.type === 'Identifier' && node.callee.name === 'test') {
                isTestCall = true;
            } else if (
                node.callee.type === 'MemberExpression' &&
                node.callee.object &&
                node.callee.object.type === 'Identifier' &&
                node.callee.object.name === 'test' &&
                node.callee.property &&
                ['only', 'skip', 'fixme'].includes(node.callee.property.name)
            ) {
                isTestCall = true;
            }

            if (isTestCall && node.arguments && node.arguments.length >= 2) {
                const firstArg = node.arguments[0];
                if (firstArg.type === 'Literal' && typeof firstArg.value === 'string') {
                    testTitle = firstArg.value;
                } else if (firstArg.type === 'TemplateLiteral' && firstArg.quasis && firstArg.quasis.length > 0) {
                    testTitle = firstArg.quasis.map(q => q.value.raw).join('${...}');
                }

                const screenshots = [];
                const testBody = node.arguments[1];

                traverse(testBody, (innerNode) => {
                    if (
                        innerNode.type === 'CallExpression' &&
                        innerNode.callee &&
                        innerNode.callee.type === 'MemberExpression' &&
                        innerNode.callee.property &&
                        innerNode.callee.property.name === 'toHaveScreenshot'
                    ) {
                        const line = innerNode.loc ? innerNode.loc.start.line : 0;
                        let snapshotName = 'auto';
                        if (innerNode.arguments && innerNode.arguments.length > 0) {
                            const arg0 = innerNode.arguments[0];
                            if (arg0.type === 'Literal' && typeof arg0.value === 'string') {
                                snapshotName = arg0.value;
                            } else if (arg0.type === 'TemplateLiteral') {
                                snapshotName = arg0.quasis.map(q => q.value.raw).join('${...}');
                            }
                        }
                        screenshots.push({ line, snapshotName });
                    }
                });

                const testInfo = {
                    file: filename,
                    line: node.loc.start.line,
                    title: testTitle,
                    screenshotCount: screenshots.length,
                    screenshots,
                };

                testCases.push(testInfo);
                if (screenshots.length > 1) {
                    violations.push(testInfo);
                }
            }
        }
    });

    return { testCases, violations };
}

function auditScreendiffDirectory(dir) {
    const files = findScreendiffFiles(dir);
    const allTests = [];
    const allViolations = [];

    for (const file of files) {
        try {
            const code = fs.readFileSync(file, 'utf8');
            const { testCases, violations } = auditScreendiffCode(code, file);
            allTests.push(...testCases);
            allViolations.push(...violations);
        } catch (err) {
            console.error(`Failed to parse ${file}: ${err.message}`);
        }
    }

    return {
        fileCount: files.length,
        allTests,
        violations: allViolations,
    };
}

function main() {
    const clientSrcDir = path.resolve(__dirname, '../client/src');
    console.log(`Auditing screendiff test files in ${clientSrcDir}...`);
    const { fileCount, allTests, violations } = auditScreendiffDirectory(clientSrcDir);

    console.log(`Found ${fileCount} screendiff test files.`);
    console.log(`Total test cases analyzed: ${allTests.length}`);
    console.log(`Tests with > 1 screenshot assertions: ${violations.length}`);

    if (violations.length > 0) {
        console.error('\n❌ VIOLATIONS FOUND:');
        for (const v of violations) {
            const relFile = path.relative(path.resolve(__dirname, '..'), v.file);
            console.error(`\nFile: ${relFile}:${v.line}`);
            console.error(`Test: "${v.title}"`);
            console.error(`Screenshot count: ${v.screenshotCount}`);
            v.screenshots.forEach(s => console.error(`  - Line ${s.line}: toHaveScreenshot("${s.snapshotName}")`));
        }
        process.exit(1);
    } else {
        console.log('\n✅ AUDIT PASSED: All screendiff tests contain at most ONE screenshot assertion!');
        process.exit(0);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    findScreendiffFiles,
    auditScreendiffCode,
    auditScreendiffDirectory,
};
