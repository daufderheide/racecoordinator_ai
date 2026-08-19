const { test, describe } = require('node:test');
const assert = require('node:assert');
const { determineVersion, getReleaseTitle } = require('./determine_release_version');

describe('determine_release_version', () => {
  describe('getReleaseTitle', () => {
    test('should format official release titles', () => {
      assert.strictEqual(getReleaseTitle('1.0.0', false), 'Race Coordinator AI v1.0.0 (Official Release)');
      assert.strictEqual(getReleaseTitle('1.0.0', 'false'), 'Race Coordinator AI v1.0.0 (Official Release)');
    });

    test('should format beta release titles', () => {
      assert.strictEqual(getReleaseTitle('1.0.0-beta.1', true), 'Race Coordinator AI v1.0.0 Beta 1');
      assert.strictEqual(getReleaseTitle('1.0.0-beta.12', 'true'), 'Race Coordinator AI v1.0.0 Beta 12');
    });

    test('should format alpha release titles', () => {
      assert.strictEqual(getReleaseTitle('0.0.0-alpha.20260819', true), 'Race Coordinator AI v0.0.0 Alpha (20260819)');
      assert.strictEqual(getReleaseTitle('0.0.0-alpha.8d14bdb', 'true'), 'Race Coordinator AI v0.0.0 Alpha (8d14bdb)');
    });
  });

  describe('daily alpha releases (schedule event)', () => {
    test('should calculate daily alpha for schedule event with default root version', () => {
      const res = determineVersion('schedule', 'refs/heads/develop', '', [], '0.0.0');
      assert.match(res.version, /^0\.0\.0-alpha\.\d{8}$/);
      assert.strictEqual(res.tag, `v${res.version}`);
      assert.strictEqual(res.isPrerelease, 'true');
      assert.match(res.releaseTitle, /^Race Coordinator AI v0\.0\.0 Alpha \(\d{8}\)$/);
    });

    test('should calculate daily alpha for schedule event with updated root version', () => {
      const res = determineVersion('schedule', 'refs/heads/develop', '', [], '1.2.0');
      assert.match(res.version, /^1\.2\.0-alpha\.\d{8}$/);
      assert.strictEqual(res.tag, `v${res.version}`);
      assert.strictEqual(res.isPrerelease, 'true');
      assert.match(res.releaseTitle, /^Race Coordinator AI v1\.2\.0 Alpha \(\d{8}\)$/);
    });
  });

  describe('explicit tag pushes', () => {
    test('should use explicit tag push when tag is provided', () => {
      const res1 = determineVersion('push', 'refs/tags/v1.0.0', '');
      assert.strictEqual(res1.version, '1.0.0');
      assert.strictEqual(res1.tag, 'v1.0.0');
      assert.strictEqual(res1.isPrerelease, 'false');
      assert.strictEqual(res1.releaseTitle, 'Race Coordinator AI v1.0.0 (Official Release)');

      const res2 = determineVersion('push', 'refs/tags/v1.0.0-beta.3', '');
      assert.strictEqual(res2.version, '1.0.0-beta.3');
      assert.strictEqual(res2.tag, 'v1.0.0-beta.3');
      assert.strictEqual(res2.isPrerelease, 'true');
      assert.strictEqual(res2.releaseTitle, 'Race Coordinator AI v1.0.0 Beta 3');
    });
  });

  describe('manual release (workflow_dispatch)', () => {
    test('should fail when triggered on main branch', () => {
      assert.throws(() => {
        determineVersion('workflow_dispatch', 'refs/heads/main', '');
      }, /Manual release is not permitted on 'main'/);

      assert.throws(() => {
        determineVersion('workflow_dispatch', 'main', '');
      }, /Manual release is not permitted on 'main'/);
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
      assert.strictEqual(res.releaseTitle, 'Race Coordinator AI v0.0.0 Alpha (8d14bdb)');
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
      assert.strictEqual(res.releaseTitle, 'Race Coordinator AI v1.2.0 Alpha (0356b23)');
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
      assert.strictEqual(res.releaseTitle, 'Race Coordinator AI v1.5.0 Beta 2');
    });
  });

  describe('push to release branch (beta releases)', () => {
    test('should start at beta.1 if no existing beta tags', () => {
      const res = determineVersion('push', 'refs/heads/release/v1.0.0', '', [], '0.0.0');
      assert.strictEqual(res.version, '1.0.0-beta.1');
      assert.strictEqual(res.tag, 'v1.0.0-beta.1');
      assert.strictEqual(res.isPrerelease, 'true');
      assert.strictEqual(res.releaseTitle, 'Race Coordinator AI v1.0.0 Beta 1');
    });

    test('should increment beta number when beta tags exist', () => {
      const existingTags = ['v1.0.0-beta.1', 'v1.0.0-beta.2', 'v0.9.0'];
      const res = determineVersion('push', 'refs/heads/release/v1.0.0', '', existingTags, '0.0.0');
      assert.strictEqual(res.version, '1.0.0-beta.3');
      assert.strictEqual(res.tag, 'v1.0.0-beta.3');
      assert.strictEqual(res.isPrerelease, 'true');
      assert.strictEqual(res.releaseTitle, 'Race Coordinator AI v1.0.0 Beta 3');
    });

    test('should handle multi-digit beta numbers correctly (e.g. beta.9 -> beta.10)', () => {
      const existingTags = ['v1.0.0-beta.1', 'v1.0.0-beta.9'];
      const res = determineVersion('push', 'refs/heads/release/v1.0.0', '', existingTags, '0.0.0');
      assert.strictEqual(res.version, '1.0.0-beta.10');
      assert.strictEqual(res.tag, 'v1.0.0-beta.10');
      assert.strictEqual(res.isPrerelease, 'true');
      assert.strictEqual(res.releaseTitle, 'Race Coordinator AI v1.0.0 Beta 10');
    });

    test('should handle release branches without leading v and short versions (e.g. release/1.0)', () => {
      const res = determineVersion('push', 'refs/heads/release/1.0', '', [], '0.0.0');
      assert.strictEqual(res.version, '1.0.0-beta.1');
      assert.strictEqual(res.tag, 'v1.0.0-beta.1');
      assert.strictEqual(res.releaseTitle, 'Race Coordinator AI v1.0.0 Beta 1');
    });
  });

  describe('push to main (official production releases)', () => {
    test('should start at 0.0.0 when VERSION is 0.0.0 and no tags exist', () => {
      const res = determineVersion('push', 'refs/heads/main', '', [], '0.0.0');
      assert.strictEqual(res.version, '0.0.0');
      assert.strictEqual(res.tag, 'v0.0.0');
      assert.strictEqual(res.isPrerelease, 'false');
      assert.strictEqual(res.releaseTitle, 'Race Coordinator AI v0.0.0 (Official Release)');
    });

    test('should increment patch for 0.0.x when 0.0.0 exists', () => {
      const existingTags = ['v0.0.0'];
      const res = determineVersion('push', 'refs/heads/main', '', existingTags, '0.0.0');
      assert.strictEqual(res.version, '0.0.1');
      assert.strictEqual(res.tag, 'v0.0.1');
      assert.strictEqual(res.isPrerelease, 'false');
      assert.strictEqual(res.releaseTitle, 'Race Coordinator AI v0.0.1 (Official Release)');
    });

    test('should release 1.0.0 when VERSION is updated to 1.0 or 1.0.0 with older tags existing', () => {
      const existingTags = ['v0.0.0', 'v0.0.1', 'v1.0.0-beta.1', 'v1.0.0-beta.2'];
      const res = determineVersion('push', 'refs/heads/main', '', existingTags, '1.0');
      assert.strictEqual(res.version, '1.0.0');
      assert.strictEqual(res.tag, 'v1.0.0');
      assert.strictEqual(res.isPrerelease, 'false');
      assert.strictEqual(res.releaseTitle, 'Race Coordinator AI v1.0.0 (Official Release)');
    });

    test('should increment patch to 1.0.1 on next push to main when v1.0.0 exists', () => {
      const existingTags = ['v1.0.0', 'v1.0.0-beta.1'];
      const res = determineVersion('push', 'refs/heads/main', '', existingTags, '1.0');
      assert.strictEqual(res.version, '1.0.1');
      assert.strictEqual(res.tag, 'v1.0.1');
      assert.strictEqual(res.isPrerelease, 'false');
      assert.strictEqual(res.releaseTitle, 'Race Coordinator AI v1.0.1 (Official Release)');
    });

    test('should increment patch to 1.0.2 when v1.0.0 and v1.0.1 exist', () => {
      const existingTags = ['v1.0.0', 'v1.0.1'];
      const res = determineVersion('push', 'refs/heads/main', '', existingTags, '1.0.0');
      assert.strictEqual(res.version, '1.0.2');
      assert.strictEqual(res.tag, 'v1.0.2');
      assert.strictEqual(res.isPrerelease, 'false');
      assert.strictEqual(res.releaseTitle, 'Race Coordinator AI v1.0.2 (Official Release)');
    });

    test('should reset patch to 0 when VERSION is bumped to 1.1', () => {
      const existingTags = ['v1.0.0', 'v1.0.1', 'v1.0.2'];
      const res = determineVersion('push', 'refs/heads/main', '', existingTags, '1.1');
      assert.strictEqual(res.version, '1.1.0');
      assert.strictEqual(res.tag, 'v1.1.0');
      assert.strictEqual(res.isPrerelease, 'false');
      assert.strictEqual(res.releaseTitle, 'Race Coordinator AI v1.1.0 (Official Release)');
    });
  });
});

