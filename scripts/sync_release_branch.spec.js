const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  getActiveReleaseBranches,
  parseReleaseBranches,
  getUnmergedCommitCount,
  checkHasMergeConflict,
  checkSyncStatus
} = require('./sync_release_branch');

describe('sync_release_branch', () => {
  describe('parseReleaseBranches', () => {
    test('should parse and clean release branch names', () => {
      const rawLines = [
        '  remotes/origin/main',
        '  remotes/origin/develop',
        '* release/v1.0.0',
        '  remotes/origin/release/v1.0.0',
        '  remotes/origin/release/v0.9.0',
        '  origin/release/v1.1.0'
      ];
      const branches = parseReleaseBranches(rawLines);
      assert.deepStrictEqual(branches, [
        'release/v1.1.0',
        'release/v1.0.0',
        'release/v0.9.0'
      ]);
    });

    test('should return empty list when no release branches present', () => {
      const rawLines = [
        '  develop',
        '  main',
        '  feature/test'
      ];
      const branches = parseReleaseBranches(rawLines);
      assert.deepStrictEqual(branches, []);
    });
  });

  describe('getActiveReleaseBranches', () => {
    test('should invoke custom branch list', () => {
      const branches = getActiveReleaseBranches(['release/v1.0.0', 'release/v1.2.0']);
      assert.deepStrictEqual(branches, ['release/v1.2.0', 'release/v1.0.0']);
    });

    test('should parse git branch command output using customExec', () => {
      const mockExec = () => '  origin/release/v2.0.0\n* release/v1.0.0\n';
      const branches = getActiveReleaseBranches(undefined, mockExec);
      assert.deepStrictEqual(branches, ['release/v2.0.0', 'release/v1.0.0']);
    });

    test('should handle exec failure gracefully', () => {
      const mockExec = () => {
        throw new Error('git command failed');
      };
      const branches = getActiveReleaseBranches(undefined, mockExec);
      assert.deepStrictEqual(branches, []);
    });
  });

  describe('getUnmergedCommitCount', () => {
    test('should return parsed commit count', () => {
      const mockExec = (cmd) => {
        if (cmd.includes('rev-list')) return ' 5\n';
        return '0';
      };
      const count = getUnmergedCommitCount('release/v1.0.0', 'develop', mockExec);
      assert.strictEqual(count, 5);
    });

    test('should return 0 when no unmerged commits or error', () => {
      const mockExec = () => {
        throw new Error('branch not found');
      };
      const count = getUnmergedCommitCount('release/v1.0.0', 'develop', mockExec);
      assert.strictEqual(count, 0);
    });
  });

  describe('checkHasMergeConflict', () => {
    test('should return true if conflict markers exist in merge-tree output', () => {
      const mockExec = (cmd) => {
        if (cmd.includes('merge-base')) return 'abcdef123';
        if (cmd.includes('merge-tree')) {
          return '<<<<<<< .our\nsome change\n=======\nsome conflict\n>>>>>>> .their';
        }
        return '';
      };
      const conflict = checkHasMergeConflict('release/v1.0.0', 'develop', mockExec);
      assert.strictEqual(conflict, true);
    });

    test('should return false if clean merge', () => {
      const mockExec = (cmd) => {
        if (cmd.includes('merge-base')) return 'abcdef123';
        if (cmd.includes('merge-tree')) {
          return 'clean merged content without conflict markers';
        }
        return '';
      };
      const conflict = checkHasMergeConflict('release/v1.0.0', 'develop', mockExec);
      assert.strictEqual(conflict, false);
    });

    test('should return false on error or empty merge base', () => {
      const mockExec = (cmd) => {
        if (cmd.includes('merge-base')) return '';
        return '';
      };
      const conflict = checkHasMergeConflict('release/v1.0.0', 'develop', mockExec);
      assert.strictEqual(conflict, false);
    });
  });

  describe('checkSyncStatus', () => {
    test('should return NO_RELEASE_BRANCH when no release branch exists', () => {
      const status = checkSyncStatus({
        branches: ['main', 'develop']
      });
      assert.strictEqual(status.status, 'NO_RELEASE_BRANCH');
      assert.strictEqual(status.hasReleaseBranch, false);
      assert.strictEqual(status.hasUnmergedCommits, false);
      assert.strictEqual(status.unmergedCount, 0);
    });

    test('should return SYNCED when unmerged count is 0', () => {
      const mockExec = (cmd) => {
        if (cmd.includes('rev-list')) return '0';
        return '';
      };
      const status = checkSyncStatus({
        branches: ['release/v1.0.0'],
        exec: mockExec
      });
      assert.strictEqual(status.status, 'SYNCED');
      assert.strictEqual(status.hasReleaseBranch, true);
      assert.strictEqual(status.activeReleaseBranch, 'release/v1.0.0');
      assert.strictEqual(status.unmergedCount, 0);
      assert.strictEqual(status.hasUnmergedCommits, false);
      assert.strictEqual(status.hasConflict, false);
    });

    test('should return PENDING_MERGE when unmerged commits exist without conflicts', () => {
      const mockExec = (cmd) => {
        if (cmd.includes('rev-list')) return '3';
        if (cmd.includes('merge-base')) return 'base123';
        if (cmd.includes('merge-tree')) return 'clean diff';
        return '';
      };
      const status = checkSyncStatus({
        branches: ['release/v1.0.0'],
        exec: mockExec
      });
      assert.strictEqual(status.status, 'PENDING_MERGE');
      assert.strictEqual(status.hasUnmergedCommits, true);
      assert.strictEqual(status.unmergedCount, 3);
      assert.strictEqual(status.hasConflict, false);
    });

    test('should return CONFLICT when unmerged commits have merge conflict', () => {
      const mockExec = (cmd) => {
        if (cmd.includes('rev-list')) return '2';
        if (cmd.includes('merge-base')) return 'base123';
        if (cmd.includes('merge-tree')) return '<<<<<<< changed in both';
        return '';
      };
      const status = checkSyncStatus({
        branches: ['release/v1.0.0'],
        exec: mockExec
      });
      assert.strictEqual(status.status, 'CONFLICT');
      assert.strictEqual(status.hasUnmergedCommits, true);
      assert.strictEqual(status.unmergedCount, 2);
      assert.strictEqual(status.hasConflict, true);
    });
  });
});
