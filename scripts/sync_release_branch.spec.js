const { test, describe } = require('node:test');
const assert = require('node:assert');
const {
  resolveGitRef,
  getActiveReleaseBranches,
  parseReleaseBranches,
  getUnmergedCommitCount,
  isBlockingConflict,
  checkHasMergeConflict,
  checkSyncStatus
} = require('./sync_release_branch');

describe('sync_release_branch', () => {
  describe('resolveGitRef', () => {
    test('should return empty string if ref is falsy', () => {
      assert.strictEqual(resolveGitRef(''), '');
      assert.strictEqual(resolveGitRef(null), '');
    });

    test('should resolve existing local ref first', () => {
      const mockExec = (cmd) => {
        if (cmd.includes('rev-parse --verify "release/v1.0.0"')) return '';
        throw new Error('not found');
      };
      assert.strictEqual(resolveGitRef('release/v1.0.0', mockExec), 'release/v1.0.0');
    });

    test('should fallback to origin/ prefix if local ref does not exist', () => {
      const mockExec = (cmd) => {
        if (cmd.includes('rev-parse --verify "origin/release/v1.0.0"')) return '';
        throw new Error('not found');
      };
      assert.strictEqual(resolveGitRef('release/v1.0.0', mockExec), 'origin/release/v1.0.0');
    });

    test('should fallback to original ref if all verify candidates fail', () => {
      const mockExec = () => {
        throw new Error('not found');
      };
      assert.strictEqual(resolveGitRef('release/v1.0.0', mockExec), 'release/v1.0.0');
    });
  });

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
    test('should return parsed commit count with resolved remote branch', () => {
      const mockExec = (cmd) => {
        if (cmd.includes('rev-parse --verify "origin/release/v1.0.0"')) return '';
        if (cmd.includes('rev-list')) {
          if (cmd.includes('develop..origin/release/v1.0.0')) return ' 5\n';
        }
        throw new Error('not found');
      };
      const count = getUnmergedCommitCount('release/v1.0.0', 'develop', mockExec);
      assert.strictEqual(count, 5);
    });

    test('should return parsed commit count with local branch', () => {
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

  describe('isBlockingConflict', () => {
    test('should return false for empty or clean output', () => {
      assert.strictEqual(isBlockingConflict(''), true); // Empty error output treated as true
      assert.strictEqual(isBlockingConflict('Everything merged cleanly'), false);
    });

    test('should return false when only VERSION conflicts', () => {
      const output = 'Auto-merging VERSION\nCONFLICT (content): Merge conflict in VERSION';
      assert.strictEqual(isBlockingConflict(output), false);
    });

    test('should return true when files other than VERSION conflict', () => {
      const output = 'CONFLICT (content): Merge conflict in VERSION\nCONFLICT (content): Merge conflict in src/app.ts';
      assert.strictEqual(isBlockingConflict(output), true);
    });

    test('should return true for legacy conflict markers', () => {
      const output = '<<<<<<< .our\nfoo\n=======\nbar\n>>>>>>> .their';
      assert.strictEqual(isBlockingConflict(output), true);
    });
  });

  describe('checkHasMergeConflict', () => {
    test('should return true if conflict markers exist in merge-tree output', () => {
      const mockExec = (cmd) => {
        if (cmd.includes('--write-tree')) {
          const err = new Error('conflict');
          err.status = 1;
          err.stdout = 'CONFLICT (content): Merge conflict in src/app.ts';
          throw err;
        }
        if (cmd.includes('merge-base')) return 'abcdef123';
        if (cmd.includes('merge-tree')) {
          return '<<<<<<< .our\nsome change\n=======\nsome conflict\n>>>>>>> .their';
        }
        return '';
      };
      const conflict = checkHasMergeConflict('release/v1.0.0', 'develop', mockExec);
      assert.strictEqual(conflict, true);
    });

    test('should return false if only VERSION conflicts in --write-tree', () => {
      const mockExec = (cmd) => {
        if (cmd.includes('--write-tree')) {
          const err = new Error('conflict');
          err.status = 1;
          err.stdout = 'CONFLICT (content): Merge conflict in VERSION';
          throw err;
        }
        return '';
      };
      const conflict = checkHasMergeConflict('release/v1.0.0', 'develop', mockExec);
      assert.strictEqual(conflict, false);
    });

    test('should return false if clean merge with --write-tree', () => {
      const mockExec = (cmd) => {
        if (cmd.includes('--write-tree')) {
          return 'tree_hash_123456';
        }
        return '';
      };
      const conflict = checkHasMergeConflict('release/v1.0.0', 'develop', mockExec);
      assert.strictEqual(conflict, false);
    });

    test('should return false on empty merge base in fallback', () => {
      const mockExec = (cmd) => {
        if (cmd.includes('--write-tree')) {
          throw new Error('unsupported flag --write-tree'); // triggers fallback
        }
        if (cmd.includes('merge-base')) return '';
        return '';
      };
      const conflict = checkHasMergeConflict('release/v1.0.0', 'develop', mockExec);
      assert.strictEqual(conflict, false);
    });

    test('should return true if fallback merge-tree throws unexpected error (fail-safe)', () => {
      const mockExec = (cmd) => {
        if (cmd.includes('--write-tree')) {
          throw new Error('unsupported flag --write-tree');
        }
        if (cmd.includes('merge-base')) return 'abcdef123';
        if (cmd.includes('merge-tree')) {
          throw new Error('spawnSync ENOBUFS');
        }
        return '';
      };
      const conflict = checkHasMergeConflict('release/v1.0.0', 'develop', mockExec);
      assert.strictEqual(conflict, true);
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
