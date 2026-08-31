const { test, describe } = require('node:test');
const assert = require('node:assert');
const { validateCommitMessage, ALLOWED_TYPES } = require('./validate_commit_message');

describe('validate_commit_message', () => {
  describe('Valid conventional commits', () => {
    test('should accept simple conventional commits for all allowed types', () => {
      for (const type of ALLOWED_TYPES) {
        const msg = `${type}: implement core functionality`;
        const res = validateCommitMessage(msg);
        assert.strictEqual(res.isValid, true, `Failed on allowed type: ${type}`);
        assert.strictEqual(res.type, type);
        assert.strictEqual(res.subject, 'implement core functionality');
        assert.strictEqual(res.scope, null);
        assert.strictEqual(res.isBreaking, false);
      }
    });

    test('should accept scoped commit messages', () => {
      const res = validateCommitMessage('feat(phidget): add relay control handler');
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.type, 'feat');
      assert.strictEqual(res.scope, 'phidget');
      assert.strictEqual(res.subject, 'add relay control handler');
      assert.strictEqual(res.isBreaking, false);
    });

    test('should accept breaking change commits with exclamation mark', () => {
      const res1 = validateCommitMessage('feat!: remove legacy database endpoint');
      assert.strictEqual(res1.isValid, true);
      assert.strictEqual(res1.type, 'feat');
      assert.strictEqual(res1.isBreaking, true);

      const res2 = validateCommitMessage('refactor(api)!: migrate all models to proto v3');
      assert.strictEqual(res2.isValid, true);
      assert.strictEqual(res2.type, 'refactor');
      assert.strictEqual(res2.scope, 'api');
      assert.strictEqual(res2.isBreaking, true);
    });

    test('should handle multi-line commit messages by validating the first line', () => {
      const msg = `fix(timer): correct lap interval rounding\n\nDetailed explanation of the fix.\nCloses #42.`;
      const res = validateCommitMessage(msg);
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.type, 'fix');
      assert.strictEqual(res.scope, 'timer');
      assert.strictEqual(res.subject, 'correct lap interval rounding');
    });

    test('should exempt automated merge, revert, and release commits', () => {
      assert.strictEqual(validateCommitMessage('Merge branch \'develop\' into release/v1.0.0').isValid, true);
      assert.strictEqual(validateCommitMessage('Merge remote-tracking branch \'origin/main\'').isValid, true);
      assert.strictEqual(validateCommitMessage('Merge pull request #12 from daufderheide/feature-test').isValid, true);
      assert.strictEqual(validateCommitMessage('Revert "feat: add experimental lap counter"').isValid, true);
      assert.strictEqual(validateCommitMessage('v1.0.0').isValid, true);
      assert.strictEqual(validateCommitMessage('v1.0.0-beta.1').isValid, true);
      assert.strictEqual(validateCommitMessage('Release v1.0.0').isValid, true);
    });
  });

  describe('Invalid commit messages', () => {
    test('should reject empty or whitespace-only messages', () => {
      assert.strictEqual(validateCommitMessage('').isValid, false);
      assert.strictEqual(validateCommitMessage('   ').isValid, false);
      assert.strictEqual(validateCommitMessage(null).isValid, false);
    });

    test('should reject commit messages without a recognized type', () => {
      const res = validateCommitMessage('random text without type');
      assert.strictEqual(res.isValid, false);
      assert.ok(res.error.includes('Expected conventional format'));
    });

    test('should reject unknown commit types', () => {
      const res = validateCommitMessage('foo(scope): something');
      assert.strictEqual(res.isValid, false);
      assert.ok(res.error.includes('Unknown commit type "foo"'));
    });

    test('should reject messages missing space after colon', () => {
      const res = validateCommitMessage('feat:no space after colon');
      assert.strictEqual(res.isValid, false);
    });

    test('should reject empty descriptions', () => {
      const res = validateCommitMessage('feat:    ');
      assert.strictEqual(res.isValid, false);
    });
  });
});
