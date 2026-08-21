const { test, describe } = require('node:test');
const assert = require('node:assert');
const { determineVersion, getReleaseTitle } = require('./determine_release_version');

describe('determine_release_version', () => {
  describe('getReleaseTitle', () => {
    test('should format official release titles', () => {
      assert.strictEqual(getReleaseTitle('1.0.0', false), 'v1.0.0 — Official Release');
      assert.strictEqual(getReleaseTitle('1.0.0', 'false'), 'v1.0.0 — Official Release');
    });

    test('should format beta release titles', () => {
      assert.strictEqual(getReleaseTitle('1.0.0-beta.1', true), 'v1.0.0-beta.1 — Beta Preview');
      assert.strictEqual(getReleaseTitle('1.0.0-beta.12', 'true'), 'v1.0.0-beta.12 — Beta Preview');
    });

    test('should format alpha release titles', () => {
      assert.strictEqual(getReleaseTitle('0.0.0-alpha.20260819', true), 'v0.0.0-alpha.20260819 — Alpha Build');
      assert.strictEqual(getReleaseTitle('0.0.0-alpha.8d14bdb', 'true'), 'v0.0.0-alpha.8d14bdb — Alpha Build');
    });
  });

  describe('daily alpha releases (schedule event)', () => {
    test('should calculate daily alpha for schedule event with default root version', () => {
      const res = determineVersion('schedule', 'refs/heads/develop', '', [], '0.0.0');
      assert.match(res.version, /^0\.0\.0-alpha\.\d{8}$/);
      assert.strictEqual(res.tag, `v${res.version}`);
      assert.strictEqual(res.isPrerelease, 'true');
      assert.match(res.releaseTitle, /^v0\.0\.0-alpha\.\d{8} — Alpha Build$/);
    });

    test('should calculate daily alpha for schedule event with updated root version', () => {
      const res = determineVersion('schedule', 'refs/heads/develop', '', [], '1.2.0');
      assert.match(res.version, /^1\.2\.0-alpha\.\d{8}$/);
      assert.strictEqual(res.tag, `v${res.version}`);
      assert.strictEqual(res.isPrerelease, 'true');
      assert.match(res.releaseTitle, /^v1\.2\.0-alpha\.\d{8} — Alpha Build$/);
    });
  });

  describe('explicit tag pushes', () => {
    test('should use explicit tag push when tag is provided', () => {
      const res1 = determineVersion('push', 'refs/tags/v1.0.0', '');
      assert.strictEqual(res1.version, '1.0.0');
      assert.strictEqual(res1.tag, 'v1.0.0');
      assert.strictEqual(res1.isPrerelease, 'false');
      assert.strictEqual(res1.releaseTitle, 'v1.0.0 — Official Release');

      const res2 = determineVersion('push', 'refs/tags/v1.0.0-beta.3', '');
      assert.strictEqual(res2.version, '1.0.0-beta.3');
      assert.strictEqual(res2.tag, 'v1.0.0-beta.3');
      assert.strictEqual(res2.isPrerelease, 'true');
      assert.strictEqual(res2.releaseTitle, 'v1.0.0-beta.3 — Beta Preview');
    });
  });

  describe('manual release (workflow_dispatch)', () => {
    test('should generate official release on main branch without version override', () => {
      const res1 = determineVersion('workflow_dispatch', 'refs/heads/main', '', [], '1.0.0');
      assert.strictEqual(res1.version, '1.0.0');
      assert.strictEqual(res1.tag, 'v1.0.0');
      assert.strictEqual(res1.isPrerelease, 'false');
      assert.strictEqual(res1.releaseTitle, 'v1.0.0 — Official Release');

      const existingTags = ['v1.0.0'];
      const res2 = determineVersion('workflow_dispatch', 'main', '', existingTags, '1.0.0');
      assert.strictEqual(res2.version, '1.0.1');
      assert.strictEqual(res2.tag, 'v1.0.1');
      assert.strictEqual(res2.isPrerelease, 'false');
      assert.strictEqual(res2.releaseTitle, 'v1.0.1 — Official Release');
    });

    test('should handle manual workflow_dispatch override on main', () => {
      const res = determineVersion('workflow_dispatch', 'refs/heads/main', '2.0.0');
      assert.strictEqual(res.version, '2.0.0');
      assert.strictEqual(res.tag, 'v2.0.0');
      assert.strictEqual(res.isPrerelease, 'false');
      assert.strictEqual(res.releaseTitle, 'v2.0.0 — Official Release');
    });

    test('should fail when triggered on release branch', () => {
      assert.throws(() => {
        determineVersion('workflow_dispatch', 'refs/heads/release/v1.0.0', '');
      }, /Manual release is not permitted on 'release\/v1\.0\.0'/);

      assert.throws(() => {
        determineVersion('workflow_dispatch', 'release/v1.0.0', '');
      }, /Manual release is not permitted on 'release\/v1\.0\.0'/);
    });

    test('should generate vX.Y.Z-alpha.<hash> on develop without version input', () => {
      const res = determineVersion(
        'workflow_dispatch',
        'refs/heads/develop',
        '',
        [],
        '0.0.0',
        '8d14bdb'
      );
      assert.strictEqual(res.version, '0.0.0-alpha.8d14bdb');
      assert.strictEqual(res.tag, 'v0.0.0-alpha.8d14bdb');
      assert.strictEqual(res.isPrerelease, 'true');
      assert.strictEqual(res.releaseTitle, 'v0.0.0-alpha.8d14bdb — Alpha Build');
    });

    test('should generate vX.Y.Z-alpha.<hash> with custom root version on develop', () => {
      const res = determineVersion(
        'workflow_dispatch',
        'refs/heads/develop',
        '',
        [],
        '1.2.0',
        '0356b23'
      );
      assert.strictEqual(res.version, '1.2.0-alpha.0356b23');
      assert.strictEqual(res.tag, 'v1.2.0-alpha.0356b23');
      assert.strictEqual(res.isPrerelease, 'true');
      assert.strictEqual(res.releaseTitle, 'v1.2.0-alpha.0356b23 — Alpha Build');
    });

    test('should handle manual workflow_dispatch override on develop', () => {
      const res = determineVersion(
        'workflow_dispatch',
        'refs/heads/develop',
        '1.5.0-beta.2'
      );
      assert.strictEqual(res.version, '1.5.0-beta.2');
      assert.strictEqual(res.tag, 'v1.5.0-beta.2');
      assert.strictEqual(res.isPrerelease, 'true');
      assert.strictEqual(res.releaseTitle, 'v1.5.0-beta.2 — Beta Preview');
    });
  });

  describe('push to release branch (beta releases)', () => {
    test('should start at beta.1 if no existing beta tags', () => {
      const res = determineVersion('push', 'refs/heads/release/v1.0.0', '', [], '0.0.0');
      assert.strictEqual(res.version, '1.0.0-beta.1');
      assert.strictEqual(res.tag, 'v1.0.0-beta.1');
      assert.strictEqual(res.isPrerelease, 'true');
      assert.strictEqual(res.releaseTitle, 'v1.0.0-beta.1 — Beta Preview');
    });

    test('should increment beta number when beta tags exist', () => {
      const existingTags = ['v1.0.0-beta.1', 'v1.0.0-beta.2', 'v0.9.0'];
      const res = determineVersion('push', 'refs/heads/release/v1.0.0', '', existingTags, '0.0.0');
      assert.strictEqual(res.version, '1.0.0-beta.3');
      assert.strictEqual(res.tag, 'v1.0.0-beta.3');
      assert.strictEqual(res.isPrerelease, 'true');
      assert.strictEqual(res.releaseTitle, 'v1.0.0-beta.3 — Beta Preview');
    });

    test('should handle multi-digit beta numbers correctly (e.g. beta.9 -> beta.10)', () => {
      const existingTags = ['v1.0.0-beta.1', 'v1.0.0-beta.9'];
      const res = determineVersion('push', 'refs/heads/release/v1.0.0', '', existingTags, '0.0.0');
      assert.strictEqual(res.version, '1.0.0-beta.10');
      assert.strictEqual(res.tag, 'v1.0.0-beta.10');
      assert.strictEqual(res.isPrerelease, 'true');
      assert.strictEqual(res.releaseTitle, 'v1.0.0-beta.10 — Beta Preview');
    });

    test('should handle release branches without leading v and short versions (e.g. release/1.0)', () => {
      const res = determineVersion('push', 'refs/heads/release/1.0', '', [], '0.0.0');
      assert.strictEqual(res.version, '1.0.0-beta.1');
      assert.strictEqual(res.tag, 'v1.0.0-beta.1');
      assert.strictEqual(res.releaseTitle, 'v1.0.0-beta.1 — Beta Preview');
    });
  });

  describe('push to main (official production releases)', () => {
    test('should start at 0.0.0 when VERSION is 0.0.0 and no tags exist', () => {
      const res = determineVersion('push', 'refs/heads/main', '', [], '0.0.0');
      assert.strictEqual(res.version, '0.0.0');
      assert.strictEqual(res.tag, 'v0.0.0');
      assert.strictEqual(res.isPrerelease, 'false');
      assert.strictEqual(res.releaseTitle, 'v0.0.0 — Official Release');
    });

    test('should increment patch for 0.0.x when 0.0.0 exists', () => {
      const existingTags = ['v0.0.0'];
      const res = determineVersion('push', 'refs/heads/main', '', existingTags, '0.0.0');
      assert.strictEqual(res.version, '0.0.1');
      assert.strictEqual(res.tag, 'v0.0.1');
      assert.strictEqual(res.isPrerelease, 'false');
      assert.strictEqual(res.releaseTitle, 'v0.0.1 — Official Release');
    });

    test('should release 1.0.0 when VERSION is updated to 1.0 or 1.0.0 with older tags existing', () => {
      const existingTags = ['v0.0.0', 'v0.0.1', 'v1.0.0-beta.1', 'v1.0.0-beta.2'];
      const res = determineVersion('push', 'refs/heads/main', '', existingTags, '1.0');
      assert.strictEqual(res.version, '1.0.0');
      assert.strictEqual(res.tag, 'v1.0.0');
      assert.strictEqual(res.isPrerelease, 'false');
      assert.strictEqual(res.releaseTitle, 'v1.0.0 — Official Release');
    });

    test('should increment patch to 1.0.1 on next push to main when v1.0.0 exists', () => {
      const existingTags = ['v1.0.0', 'v1.0.0-beta.1'];
      const res = determineVersion('push', 'refs/heads/main', '', existingTags, '1.0');
      assert.strictEqual(res.version, '1.0.1');
      assert.strictEqual(res.tag, 'v1.0.1');
      assert.strictEqual(res.isPrerelease, 'false');
      assert.strictEqual(res.releaseTitle, 'v1.0.1 — Official Release');
    });

    test('should increment patch to 1.0.2 when v1.0.0 and v1.0.1 exist', () => {
      const existingTags = ['v1.0.0', 'v1.0.1'];
      const res = determineVersion('push', 'refs/heads/main', '', existingTags, '1.0.0');
      assert.strictEqual(res.version, '1.0.2');
      assert.strictEqual(res.tag, 'v1.0.2');
      assert.strictEqual(res.isPrerelease, 'false');
      assert.strictEqual(res.releaseTitle, 'v1.0.2 — Official Release');
    });

    test('should reset patch to 0 when VERSION is bumped to 1.1', () => {
      const existingTags = ['v1.0.0', 'v1.0.1', 'v1.0.2'];
      const res = determineVersion('push', 'refs/heads/main', '', existingTags, '1.1');
      assert.strictEqual(res.version, '1.1.0');
      assert.strictEqual(res.tag, 'v1.1.0');
      assert.strictEqual(res.isPrerelease, 'false');
      assert.strictEqual(res.releaseTitle, 'v1.1.0 — Official Release');
    });
  });
});

