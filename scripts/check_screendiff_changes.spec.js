const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  isUiComponentFile,
  isScreendiffFile,
  isBypassCommit,
  evaluateScreendiffCommitCheck,
  normalizePath,
} = require('./check_screendiff_changes');

describe('check_screendiff_changes', () => {
  describe('normalizePath', () => {
    test('should normalize backslashes and leading ./', () => {
      assert.strictEqual(normalizePath('.\\client\\src\\styles.scss'), 'client/src/styles.scss');
      assert.strictEqual(normalizePath('./client/src/app/app.component.ts'), 'client/src/app/app.component.ts');
      assert.strictEqual(normalizePath(''), '');
      assert.strictEqual(normalizePath(null), '');
    });
  });

  describe('isUiComponentFile', () => {
    test('should identify Angular component files as UI files', () => {
      assert.strictEqual(
        isUiComponentFile('client/src/app/components/race-editor/race-editor.component.ts'),
        true
      );
      assert.strictEqual(
        isUiComponentFile('client/src/app/components/race-editor/race-editor.component.html'),
        true
      );
      assert.strictEqual(
        isUiComponentFile('client/src/app/components/race-editor/race-editor.component.scss'),
        true
      );
      assert.strictEqual(
        isUiComponentFile('client/src/app/components/race-editor/race-editor.component.css'),
        true
      );
    });

    test('should identify global styles and root app component as UI files', () => {
      assert.strictEqual(isUiComponentFile('client/src/styles.scss'), true);
      assert.strictEqual(isUiComponentFile('client/src/styles.css'), true);
      assert.strictEqual(isUiComponentFile('client/src/index.html'), true);
      assert.strictEqual(isUiComponentFile('client/src/app/app.component.ts'), true);
      assert.strictEqual(isUiComponentFile('client/src/app/app.component.html'), true);
      assert.strictEqual(isUiComponentFile('client/src/app/app.component.scss'), true);
    });

    test('should identify non-i18n assets as UI files', () => {
      assert.strictEqual(isUiComponentFile('client/src/assets/images/logo.png'), true);
      assert.strictEqual(isUiComponentFile('client/src/assets/icons/car.svg'), true);
    });

    test('should ignore i18n translation JSON files', () => {
      assert.strictEqual(isUiComponentFile('client/src/assets/i18n/en.json'), false);
      assert.strictEqual(isUiComponentFile('client/src/assets/i18n/de.json'), false);
      assert.strictEqual(isUiComponentFile('client/src/assets/i18n/es.json'), false);
    });

    test('should ignore unit test files, screendiffs, and harnesses', () => {
      assert.strictEqual(
        isUiComponentFile('client/src/app/components/race-editor/race-editor.component.spec.ts'),
        false
      );
      assert.strictEqual(
        isUiComponentFile('client/src/app/components/race-editor/race-editor_screendiff_test.ts'),
        false
      );
      assert.strictEqual(
        isUiComponentFile('client/src/app/components/race-editor/testing/race-editor.harness.ts'),
        false
      );
      assert.strictEqual(
        isUiComponentFile('client/src/app/components/race-editor/race-editor.harness.base.ts'),
        false
      );
      assert.strictEqual(
        isUiComponentFile('client/src/app/components/race-editor/race-editor.harness.e2e.ts'),
        false
      );
    });

    test('should ignore snapshots directory', () => {
      assert.strictEqual(
        isUiComponentFile('client/src/app/components/race-editor/race-editor_screendiff_test.ts-snapshots/race-editor-chromium-linux.png'),
        false
      );
    });

    test('should ignore non-UI client layer files (services, models, converters, etc.)', () => {
      assert.strictEqual(isUiComponentFile('client/src/app/services/data.service.ts'), false);
      assert.strictEqual(isUiComponentFile('client/src/app/converters/driver.converter.ts'), false);
      assert.strictEqual(isUiComponentFile('client/src/app/guards/auth.guard.ts'), false);
      assert.strictEqual(isUiComponentFile('client/src/app/interfaces/driver.model.ts'), false);
      assert.strictEqual(isUiComponentFile('client/src/app/proto/race.pb.ts'), false);
      assert.strictEqual(isUiComponentFile('client/src/app/pipes/format-time.pipe.ts'), false);
    });

    test('should ignore server and tooling files', () => {
      assert.strictEqual(isUiComponentFile('server/src/main/java/com/antigravity/race/Race.java'), false);
      assert.strictEqual(isUiComponentFile('pom.xml'), false);
      assert.strictEqual(isUiComponentFile('DEVELOPMENT.md'), false);
      assert.strictEqual(isUiComponentFile('scripts/find_changed_screendiff_tests.js'), false);
      assert.strictEqual(isUiComponentFile('client/package.json'), false);
      assert.strictEqual(isUiComponentFile('client/angular.json'), false);
    });
  });

  describe('isScreendiffFile', () => {
    test('should recognize screendiff snapshot images', () => {
      assert.strictEqual(
        isScreendiffFile('client/src/app/components/race-editor/race-editor_screendiff_test.ts-snapshots/editor-chromium-linux.png'),
        true
      );
      assert.strictEqual(
        isScreendiffFile('client/src/app/components/shared/about-dialog/about-dialog_screendiff_test.ts-snapshots/about-dialog-charity-tab-chromium-linux.png'),
        true
      );
    });

    test('should recognize screendiff test files', () => {
      assert.strictEqual(
        isScreendiffFile('client/src/app/components/race-editor/race-editor_screendiff_test.ts'),
        true
      );
    });

    test('should not recognize non-screendiff files', () => {
      assert.strictEqual(isScreendiffFile('client/src/app/components/race-editor/race-editor.component.ts'), false);
      assert.strictEqual(isScreendiffFile('client/src/app/components/race-editor/race-editor.component.spec.ts'), false);
      assert.strictEqual(isScreendiffFile('client/src/assets/images/logo.png'), false);
    });
  });

  describe('isBypassCommit', () => {
    test('should bypass on conventional refactor / chore / style prefixes', () => {
      assert.strictEqual(isBypassCommit('refactor(client): extract helper method', {}).bypass, true);
      assert.strictEqual(isBypassCommit('refactor: optimize table rendering', {}).bypass, true);
      assert.strictEqual(isBypassCommit('chore(client): clean up unused variables', {}).bypass, true);
      assert.strictEqual(isBypassCommit('style(ui): fix lint spacing', {}).bypass, true);
    });

    test('should bypass on explicit commit message tags', () => {
      assert.strictEqual(isBypassCommit('feat(ui): update race editor [skip-screendiff]', {}).bypass, true);
      assert.strictEqual(isBypassCommit('feat(ui): update race editor [no-screendiff]', {}).bypass, true);
      assert.strictEqual(isBypassCommit('feat(ui): update race editor [skip-visual]', {}).bypass, true);
      assert.strictEqual(isBypassCommit('fix(ui): null safety check [refactor]', {}).bypass, true);
      assert.strictEqual(isBypassCommit('[skip screendiffs] update button handler', {}).bypass, true);
    });

    test('should bypass on commit trailers', () => {
      const msg = 'fix(client): fix state transition\n\nSkip-Screendiff: true';
      assert.strictEqual(isBypassCommit(msg, {}).bypass, true);
    });

    test('should bypass on merge commits', () => {
      assert.strictEqual(isBypassCommit("Merge branch 'develop' into feature/foo", {}).bypass, true);
      assert.strictEqual(isBypassCommit("Merge remote-tracking branch 'origin/main'", {}).bypass, true);
    });

    test('should bypass on environment variable overrides', () => {
      assert.strictEqual(isBypassCommit('feat: normal commit', { SKIP_SCREENDIFF_CHECK: '1' }).bypass, true);
      assert.strictEqual(isBypassCommit('feat: normal commit', { SKIP_SCREENDIFF: '1' }).bypass, true);
      assert.strictEqual(isBypassCommit('feat: normal commit', { NO_SCREENDIFF: '1' }).bypass, true);
    });

    test('should not bypass standard feature/bugfix commits without bypass indicators', () => {
      assert.strictEqual(isBypassCommit('feat(ui): redesign header component', {}).bypass, false);
      assert.strictEqual(isBypassCommit('fix(ui): change button color to blue', {}).bypass, false);
      assert.strictEqual(isBypassCommit('', {}).bypass, false);
      assert.strictEqual(isBypassCommit(null, {}).bypass, false);
    });
  });

  describe('evaluateScreendiffCommitCheck', () => {
    test('should pass when no UI components were modified', () => {
      const result = evaluateScreendiffCommitCheck({
        changedFiles: [
          'server/src/main/java/com/antigravity/race/Race.java',
          'client/src/app/services/data.service.ts',
          'client/src/assets/i18n/en.json',
        ],
        commitMessage: 'feat: add server endpoint',
        env: {},
      });

      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.bypassed, false);
      assert.strictEqual(result.uiFilesChanged.length, 0);
    });

    test('should pass when UI components and screendiff snapshots are both changed', () => {
      const result = evaluateScreendiffCommitCheck({
        changedFiles: [
          'client/src/app/components/race-editor/race-editor.component.ts',
          'client/src/app/components/race-editor/race-editor.component.html',
          'client/src/app/components/race-editor/race-editor_screendiff_test.ts-snapshots/editor-chromium-linux.png',
        ],
        commitMessage: 'feat(ui): update race editor layout',
        env: {},
      });

      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.bypassed, false);
      assert.strictEqual(result.uiFilesChanged.length, 2);
      assert.strictEqual(result.screendiffFilesChanged.length, 1);
    });

    test('should pass when UI components and screendiff tests are changed', () => {
      const result = evaluateScreendiffCommitCheck({
        changedFiles: [
          'client/src/app/components/race-editor/race-editor.component.ts',
          'client/src/app/components/race-editor/race-editor_screendiff_test.ts',
        ],
        commitMessage: 'feat(ui): add new visual test for editor',
        env: {},
      });

      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.bypassed, false);
    });

    test('should fail when UI components are modified without screendiff changes or bypass', () => {
      const result = evaluateScreendiffCommitCheck({
        changedFiles: [
          'client/src/app/components/race-editor/race-editor.component.ts',
          'client/src/app/components/race-editor/race-editor.component.html',
        ],
        commitMessage: 'feat(ui): redesign race editor toolbar',
        env: {},
      });

      assert.strictEqual(result.passed, false);
      assert.strictEqual(result.bypassed, false);
      assert.strictEqual(result.uiFilesChanged.length, 2);
      assert.strictEqual(result.screendiffFilesChanged.length, 0);
      assert.ok(result.message.includes('❌ Screendiff Verification Failed'));
      assert.ok(result.message.includes('race-editor.component.ts'));
    });

    test('should pass when UI components are modified without screendiff changes but with [skip-screendiff]', () => {
      const result = evaluateScreendiffCommitCheck({
        changedFiles: [
          'client/src/app/components/race-editor/race-editor.component.ts',
        ],
        commitMessage: 'fix(ui): prevent null pointer on race editor load [skip-screendiff]',
        env: {},
      });

      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.bypassed, true);
      assert.ok(result.bypassReason.includes('[skip-screendiff]'));
    });

    test('should pass when UI components are modified without screendiff changes but with refactor prefix', () => {
      const result = evaluateScreendiffCommitCheck({
        changedFiles: [
          'client/src/app/components/race-editor/race-editor.component.ts',
        ],
        commitMessage: 'refactor(race-editor): split methods for readability',
        env: {},
      });

      assert.strictEqual(result.passed, true);
      assert.strictEqual(result.bypassed, true);
      assert.ok(result.bypassReason.includes('refactor'));
    });
  });
});
