const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const {
  findPreviousTag,
  compareSemver,
  getCommits,
  formatInitialReleaseSection,
  formatBetaCommitList,
  formatOfficialReleaseNotes,
  generateChangelog,
  parseChangelogSections,
  filterChangelogSections,
  linkifyCommitText,
  updateChangelogMarkdown
} = require('./generate_changelog');

describe('generate_changelog', () => {
  describe('compareSemver & findPreviousTag', () => {
    test('should sort semver tags correctly', () => {
      const tags = ['v1.0.0', 'v1.0.1', 'v1.0.0-beta.1', 'v1.0.0-beta.2', 'v1.1.0', 'v1.1.0-beta.1'];
      tags.sort(compareSemver);
      assert.deepStrictEqual(tags, [
        'v1.1.0',
        'v1.1.0-beta.1',
        'v1.0.1',
        'v1.0.0',
        'v1.0.0-beta.2',
        'v1.0.0-beta.1'
      ]);
    });

    test('should find previous official tag for official release', () => {
      const customTags = ['v1.0.0', 'v1.0.1', 'v1.1.0-beta.1', 'v1.1.0-beta.2'];
      const prev = findPreviousTag('v1.1.0', false, customTags);
      assert.strictEqual(prev, 'v1.0.1');
    });

    test('should return null when no previous official tag exists for v1.0.0', () => {
      const customTags = ['v1.0.0-beta.1', 'v1.0.0-beta.2'];
      const prev = findPreviousTag('v1.0.0', false, customTags);
      assert.strictEqual(prev, null);
    });

    test('should find previous tag for beta release during pre-1.0 development', () => {
      const customTags = ['v1.0.0', 'v1.0.0-beta.1', 'v1.0.0-beta.2'];
      const prev = findPreviousTag('v1.0.0-beta.3', true, customTags);
      assert.strictEqual(prev, 'v1.0.0-beta.2');
    });

    test('should find previous official tag for beta releases to accumulate all changes', () => {
      const customTags = ['v1.0.0', 'v1.0.1-beta.1'];
      const prev = findPreviousTag('v1.0.1-beta.2', true, customTags);
      assert.strictEqual(prev, 'v1.0.0');
    });

    test('should ensure both last beta and official release share identical previous official tag', () => {
      const customTags = ['v1.0.0', 'v1.0.1-beta.1', 'v1.0.1-beta.2'];
      const betaPrev = findPreviousTag('v1.0.1-beta.3', true, customTags);
      const officialPrev = findPreviousTag('v1.0.1', false, customTags);
      assert.strictEqual(betaPrev, 'v1.0.0');
      assert.strictEqual(officialPrev, 'v1.0.0');
    });
  });

  describe('generateChangelog scenarios', () => {
    test('should produce initial release announcement for v1.0.0 official', () => {
      const output = generateChangelog('v1.0.0', false, { customTags: [] });
      assert.ok(output.includes('Initial Release'));
      assert.ok(output.includes('Initial release.'));
      assert.ok(output.includes('/commits/v1.0.0'));
    });

    test('should filter and categorize beta releases and exclude noise', () => {
      const customCommits = [
        { hash: 'abc1234', subject: 'feat(phidget): add relay handler', author: 'Dave' },
        { hash: 'def5678', subject: 'fix: resolve race timer crash', author: 'Dave' },
        { hash: 'ghi9012', subject: 'chore: update internal tooling', author: 'Dave' },
        { hash: 'jkl3456', subject: 'ci: update github action', author: 'Dave' }
      ];

      const output = generateChangelog('v1.0.0-beta.5', true, {
        customPreviousTag: 'v1.0.0-beta.4',
        customCommits
      });

      assert.ok(output.includes('### 🚀 New Features'));
      assert.ok(output.includes('**phidget**: add relay handler'));
      assert.ok(output.includes('### 🐛 Bug Fixes'));
      assert.ok(output.includes('resolve race timer crash'));
      assert.ok(!output.includes('update internal tooling'));
      assert.ok(output.includes('Full Commit History'));
      assert.ok(output.includes('<a href="https://github.com/daufderheide/racecoordinator_ai/compare/v1.0.0-beta.4...v1.0.0-beta.5">GitHub</a>'));
    });

    test('should filter and categorize post-1.0 official releases', () => {
      const customCommits = [
        { hash: '1111111', subject: 'feat(phidget): add relay output control', author: 'Dev' },
        { hash: '2222222', subject: 'fix(timer): resolve lap rounding edge case', author: 'Dev' },
        { hash: '3333333', subject: 'perf(ui): optimize track map render', author: 'Dev' },
        { hash: '4444444', subject: 'chore: update npm dependencies', author: 'Dev' },
        { hash: '5555555', subject: 'test: add test coverage for phidget', author: 'Dev' },
        { hash: '6666666', subject: 'screendiff: update snapshots', author: 'Dev' },
        { hash: '7777777', subject: 'Merge branch \'develop\' into release/v1.1.0', author: 'Dev' }
      ];

      const output = generateChangelog('v1.1.0', false, {
        customPreviousTag: 'v1.0.0',
        customCommits
      });

      assert.ok(output.includes('### 🚀 New Features'));
      assert.ok(output.includes('**phidget**: add relay output control'));
      assert.ok(output.includes('### 🐛 Bug Fixes'));
      assert.ok(output.includes('**timer**: resolve lap rounding edge case'));
      assert.ok(output.includes('### ⚡ Improvements & Refactoring'));
      assert.ok(output.includes('**ui**: optimize track map render'));

      // Assert noise was excluded
      assert.ok(!output.includes('update npm dependencies'));
      assert.ok(!output.includes('add test coverage for phidget'));
      assert.ok(!output.includes('update snapshots'));
      assert.ok(!output.includes('Merge branch'));
    });

    test('should include fix(beta) in beta changelogs but exclude it from official changelogs', () => {
      const customCommits = [
        { hash: 'aaa1111', subject: 'feat(webcam): add webcam track interface', author: 'Dev' },
        { hash: 'bbb2222', subject: 'fix(beta): correct webcam frame rate drop on macOS', author: 'Dev' },
        { hash: 'ccc3333', subject: 'fix(timer): resolve lap rounding edge case', author: 'Dev' }
      ];

      // 1. In Beta Release: both fix(beta) and fix(timer) appear
      const betaOutput = generateChangelog('v1.1.0-beta.2', true, {
        customPreviousTag: 'v1.1.0-beta.1',
        customCommits
      });
      assert.ok(betaOutput.includes('**webcam**: add webcam track interface'));
      assert.ok(betaOutput.includes('**beta**: correct webcam frame rate drop on macOS'));
      assert.ok(betaOutput.includes('**timer**: resolve lap rounding edge case'));

      // 2. In Official Release: fix(beta) is excluded, feat(webcam) and fix(timer) remain
      const officialOutput = generateChangelog('v1.1.0', false, {
        customPreviousTag: 'v1.0.0',
        customCommits
      });
      assert.ok(officialOutput.includes('**webcam**: add webcam track interface'));
      assert.ok(officialOutput.includes('**timer**: resolve lap rounding edge case'));
      assert.ok(!officialOutput.includes('correct webcam frame rate drop on macOS'));
    });

    test('should prioritize override notes if provided', () => {
      const output = generateChangelog('v1.1.0', false, {
        overrideNotes: '### 🌟 Custom Release Notes\n\n- Highlighted feature 1'
      });
      assert.strictEqual(output, '### 🌟 Custom Release Notes\n\n- Highlighted feature 1');
    });

    test('should pass custom toRef option when provided', () => {
      const customCommits = [
        { hash: '1234567', subject: 'fix: resolved edge case', author: 'Dev' }
      ];
      const output = generateChangelog('v1.0.0-beta.25', true, {
        customPreviousTag: 'v1.0.0-beta.24',
        customCommits,
        toRef: 'v1.0.0-beta.25'
      });
      assert.ok(output.includes('resolved edge case'));
    });

    test('should gracefully handle uncreated tag in getCommits by falling back to HEAD', () => {
      // Pass an uncreated tag as toRef and verify getCommits does not throw or fail
      const commits = getCommits('v1.0.0', 'v99.99.99-uncreated-tag');
      assert.ok(Array.isArray(commits));
    });
  });

  describe('updateChangelogMarkdown & beta retention', () => {
    test('filterChangelogSections should keep only the latest beta version and all official versions', () => {
      const sections = [
        { tag: 'v1.0.1-beta.4', content: '## [v1.0.1-beta.4]' },
        { tag: 'v1.0.1-beta.3', content: '## [v1.0.1-beta.3]' },
        { tag: 'v1.0.1-beta.2', content: '## [v1.0.1-beta.2]' },
        { tag: 'v1.0.1-beta.1', content: '## [v1.0.1-beta.1]' },
        { tag: 'v1.0.0', content: '## [v1.0.0]' }
      ];

      const filtered = filterChangelogSections(sections);
      assert.deepStrictEqual(filtered.map(s => s.tag), ['v1.0.1-beta.4', 'v1.0.0']);
    });

    test('filterChangelogSections should remove all betas when official release is present and newer', () => {
      const sections = [
        { tag: 'v1.0.1', content: '## [v1.0.1]' },
        { tag: 'v1.0.1-beta.4', content: '## [v1.0.1-beta.4]' },
        { tag: 'v1.0.0', content: '## [v1.0.0]' }
      ];

      const filtered = filterChangelogSections(sections);
      assert.deepStrictEqual(filtered.map(s => s.tag), ['v1.0.1', 'v1.0.0']);
    });

    test('filterChangelogSections should keep a new beta for the next release cycle alongside official releases', () => {
      const sections = [
        { tag: 'v1.0.2-beta.1', content: '## [v1.0.2-beta.1]' },
        { tag: 'v1.0.1', content: '## [v1.0.1]' },
        { tag: 'v1.0.0', content: '## [v1.0.0]' }
      ];

      const filtered = filterChangelogSections(sections);
      assert.deepStrictEqual(filtered.map(s => s.tag), ['v1.0.2-beta.1', 'v1.0.1', 'v1.0.0']);
    });

    test('should create and update changelog markdown file', () => {
      const tempPath = path.resolve(__dirname, '..', 'scratch_changelog_test.md');
      try {
        updateChangelogMarkdown(tempPath, 'v1.0.0', 'Initial release notes', '2026-08-22');
        let content = fs.readFileSync(tempPath, 'utf8');
        assert.ok(content.includes('# Changelog'));
        assert.ok(content.includes('## [v1.0.0] - 2026-08-22'));
        assert.ok(content.includes('Initial release notes'));

        // Add second release
        updateChangelogMarkdown(tempPath, 'v1.1.0', 'New features in v1.1.0', '2026-09-01');
        content = fs.readFileSync(tempPath, 'utf8');
        assert.ok(content.includes('## [v1.1.0] - 2026-09-01'));
        assert.ok(content.indexOf('v1.1.0') < content.indexOf('v1.0.0')); // v1.1.0 prepended before v1.0.0
      } finally {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
    });

    test('should replace older beta with newer beta and subsequently remove beta upon official release', () => {
      const tempPath = path.resolve(__dirname, '..', 'scratch_beta_lifecycle_test.md');
      try {
        // 1. Initial official release
        updateChangelogMarkdown(tempPath, 'v1.0.0', 'Initial official release', '2026-08-20');

        // 2. First beta for 1.0.1
        updateChangelogMarkdown(tempPath, 'v1.0.1-beta.1', 'Beta 1 fixes', '2026-08-25');
        let content = fs.readFileSync(tempPath, 'utf8');
        assert.ok(content.includes('## [v1.0.1-beta.1] - 2026-08-25'));
        assert.ok(content.includes('## [v1.0.0] - 2026-08-20'));

        // 3. Second beta for 1.0.1 replaces first beta
        updateChangelogMarkdown(tempPath, 'v1.0.1-beta.2', 'Beta 2 cumulative fixes', '2026-08-28');
        content = fs.readFileSync(tempPath, 'utf8');
        assert.ok(content.includes('## [v1.0.1-beta.2] - 2026-08-28'));
        assert.ok(!content.includes('## [v1.0.1-beta.1]'));
        assert.ok(content.includes('## [v1.0.0] - 2026-08-20'));

        // 4. Official v1.0.1 release removes beta.2
        updateChangelogMarkdown(tempPath, 'v1.0.1', 'Official 1.0.1 release notes', '2026-09-01');
        content = fs.readFileSync(tempPath, 'utf8');
        assert.ok(content.includes('## [v1.0.1] - 2026-09-01'));
        assert.ok(!content.includes('## [v1.0.1-beta.2]'));
        assert.ok(!content.includes('## [v1.0.1-beta.1]'));
        assert.ok(content.includes('## [v1.0.0] - 2026-08-20'));

        // 5. Next cycle beta 1.0.2-beta.1 appears alongside 1.0.1 and 1.0.0
        updateChangelogMarkdown(tempPath, 'v1.0.2-beta.1', 'Beta 1 for 1.0.2', '2026-09-10');
        content = fs.readFileSync(tempPath, 'utf8');
        assert.ok(content.includes('## [v1.0.2-beta.1] - 2026-09-10'));
        assert.ok(content.includes('## [v1.0.1] - 2026-09-01'));
        assert.ok(content.includes('## [v1.0.0] - 2026-08-20'));
      } finally {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
    });
  });

  describe('linkifyCommitText', () => {
    test('should format repository issue URLs as clean [#num](url)', () => {
      const input = 'Auto hide the countdown widget https://github.com/daufderheide/racecoordinator_ai/issues/869 [skip-screendiffs]';
      const output = linkifyCommitText(input);
      assert.strictEqual(output, 'Auto hide the countdown widget [#869](https://github.com/daufderheide/racecoordinator_ai/issues/869) [skip-screendiffs]');
    });

    test('should format repository pull request URLs as clean [#num](url)', () => {
      const input = 'Update links https://github.com/daufderheide/racecoordinator_ai/pull/873';
      const output = linkifyCommitText(input);
      assert.strictEqual(output, 'Update links [#873](https://github.com/daufderheide/racecoordinator_ai/pull/873)');
    });

    test('should format other repository issue URLs as [owner/repo#num](url)', () => {
      const input = 'Ref issue https://github.com/other-org/other-repo/issues/42 for details';
      const output = linkifyCommitText(input);
      assert.strictEqual(output, 'Ref issue [other-org/other-repo#42](https://github.com/other-org/other-repo/issues/42) for details');
    });

    test('should autolink external URLs and preserve trailing punctuation', () => {
      const input = 'Update PayPal donation link https://www.paypal.com/donate/?hosted_button_id=XYZ. Fixed.';
      const output = linkifyCommitText(input);
      assert.strictEqual(output, 'Update PayPal donation link <https://www.paypal.com/donate/?hosted_button_id=XYZ>. Fixed.');
    });

    test('should convert standalone issue references like #870 and (#870) to links', () => {
      const input = 'Fixed countdown issue (#870) and #871';
      const output = linkifyCommitText(input);
      assert.strictEqual(output, 'Fixed countdown issue ([#870](https://github.com/daufderheide/racecoordinator_ai/issues/870)) and [#871](https://github.com/daufderheide/racecoordinator_ai/issues/871)');
    });

    test('should not double-link already linked markdown links or brackets', () => {
      const input = 'Already linked [#869](https://github.com/daufderheide/racecoordinator_ai/issues/869) and <https://example.com>';
      const output = linkifyCommitText(input);
      assert.strictEqual(output, 'Already linked [#869](https://github.com/daufderheide/racecoordinator_ai/issues/869) and <https://example.com>');
    });

    test('formatOfficialReleaseNotes should linkify issue links in commit subjects', () => {
      const customCommits = [
        { hash: '1234567', subject: 'feat: add preview https://github.com/daufderheide/racecoordinator_ai/issues/869', author: 'Dev' },
        { hash: '8901234', subject: 'fix: resolve crash https://github.com/daufderheide/racecoordinator_ai/issues/870', author: 'Dev' }
      ];
      const output = formatOfficialReleaseNotes(customCommits, 'v1.0.0', true);
      assert.ok(output.includes('[#869](https://github.com/daufderheide/racecoordinator_ai/issues/869)'));
      assert.ok(output.includes('[#870](https://github.com/daufderheide/racecoordinator_ai/issues/870)'));
    });
  });
});
