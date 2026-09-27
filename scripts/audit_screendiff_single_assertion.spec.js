const { describe, it } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const {
    auditScreendiffCode,
    auditScreendiffDirectory,
} = require('./audit_screendiff_single_assertion');

describe('audit_screendiff_single_assertion', () => {
    it('should detect valid test with exactly 1 toHaveScreenshot', () => {
        const sampleCode = `
            import { test, expect } from '@playwright/test';
            test('valid test 1', async ({ page }) => {
                await page.goto('/');
                await expect(page).toHaveScreenshot('home.png');
            });
        `;
        const { testCases, violations } = auditScreendiffCode(sampleCode, 'sample.ts');
        assert.strictEqual(testCases.length, 1);
        assert.strictEqual(testCases[0].screenshotCount, 1);
        assert.strictEqual(violations.length, 0);
    });

    it('should detect violations when a test has multiple toHaveScreenshot calls', () => {
        const sampleCode = `
            import { test, expect } from '@playwright/test';
            test('invalid test with two screenshots', async ({ page }) => {
                await page.goto('/');
                await expect(page).toHaveScreenshot('home1.png');
                await page.click('button');
                await expect(page).toHaveScreenshot('home2.png');
            });
        `;
        const { testCases, violations } = auditScreendiffCode(sampleCode, 'sample.ts');
        assert.strictEqual(testCases.length, 1);
        assert.strictEqual(testCases[0].screenshotCount, 2);
        assert.strictEqual(violations.length, 1);
        assert.strictEqual(violations[0].title, 'invalid test with two screenshots');
        assert.strictEqual(violations[0].screenshots.length, 2);
    });

    it('should handle test.only and test.skip modifiers', () => {
        const sampleCode = `
            import { test, expect } from '@playwright/test';
            test.only('focused test', async ({ page }) => {
                await expect(page).toHaveScreenshot('focused.png');
            });
            test.skip('skipped test with violation', async ({ page }) => {
                await expect(page).toHaveScreenshot('s1.png');
                await expect(page).toHaveScreenshot('s2.png');
            });
        `;
        const { testCases, violations } = auditScreendiffCode(sampleCode, 'sample.ts');
        assert.strictEqual(testCases.length, 2);
        assert.strictEqual(violations.length, 1);
        assert.strictEqual(violations[0].title, 'skipped test with violation');
    });

    it('should verify current codebase has zero violations across all screendiff tests', () => {
        const clientSrcDir = path.resolve(__dirname, '../client/src');
        const { fileCount, allTests, violations } = auditScreendiffDirectory(clientSrcDir);
        assert.ok(fileCount > 0, 'Should find screendiff test files');
        assert.ok(allTests.length > 0, 'Should find screendiff test cases');
        assert.strictEqual(violations.length, 0, `Expected 0 violations but found ${violations.length}`);
    });
});
