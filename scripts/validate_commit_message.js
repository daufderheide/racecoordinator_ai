const fs = require('fs');
const path = require('path');

const ALLOWED_TYPES = [
  'feat',
  'fix',
  'refactor',
  'perf',
  'docs',
  'test',
  'chore',
  'ci',
  'style',
  'build'
];

// Matches: type(scope)!: message OR type!: message OR type: message
const CONVENTIONAL_REGEX = /^(?<type>[a-z]+)(?:\((?<scope>[a-zA-Z0-9_\-\/.]+)\))?(?<breaking>!)?:\s+(?<subject>.+)$/;

// Automated merge, revert, and release commit patterns to exempt
const EXEMPT_PATTERNS = [
  /^Merge (branch|remote-tracking branch|pull request) .+/i,
  /^Revert ".+"/i,
  /^v?\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/,
  /^Release v?\d+\.\d+\.\d+/i
];

function validateCommitMessage(message) {
  if (!message || typeof message !== 'string') {
    return {
      isValid: false,
      error: 'Commit message cannot be empty.'
    };
  }

  // Use the first line (title) of the commit message
  const firstLine = message.trim().split('\n')[0].trim();
  if (!firstLine) {
    return {
      isValid: false,
      error: 'Commit message header line cannot be empty.'
    };
  }

  // Check if exempt (e.g. merge commit)
  for (const pattern of EXEMPT_PATTERNS) {
    if (pattern.test(firstLine)) {
      return { isValid: true, isExempt: true };
    }
  }

  const match = firstLine.match(CONVENTIONAL_REGEX);
  if (!match || !match.groups) {
    return {
      isValid: false,
      error: `Invalid commit format: "${firstLine}".\n\nExpected conventional format:\n  <type>(<scope>): <description>\n  or\n  <type>: <description>\n\nAllowed types: ${ALLOWED_TYPES.join(', ')}\n\nExamples:\n  feat(phidget): add relay output control\n  fix: resolve race day startup timer crash\n  docs: update installation instructions in README`
    };
  }

  const { type, subject } = match.groups;
  if (!ALLOWED_TYPES.includes(type)) {
    return {
      isValid: false,
      error: `Unknown commit type "${type}". Allowed types are: ${ALLOWED_TYPES.join(', ')}.`
    };
  }

  if (!subject || subject.trim().length === 0) {
    return {
      isValid: false,
      error: 'Commit message description cannot be empty.'
    };
  }

  return {
    isValid: true,
    type,
    scope: match.groups.scope || null,
    isBreaking: Boolean(match.groups.breaking),
    subject: subject.trim()
  };
}

function main() {
  const commitMsgFile = process.argv[2];
  if (!commitMsgFile) {
    console.error('Usage: node validate_commit_message.js <path-to-commit-msg-file>');
    process.exit(1);
  }

  try {
    const fullPath = path.resolve(commitMsgFile);
    if (!fs.existsSync(fullPath)) {
      console.error(`Commit message file not found: ${commitMsgFile}`);
      process.exit(1);
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const result = validateCommitMessage(content);

    if (!result.isValid) {
      console.error('\n❌ [Commit Message Validation Failed]');
      console.error(result.error);
      console.error('\nPlease update your commit message to adhere to conventional commit standards.\n');
      process.exit(1);
    }
  } catch (err) {
    console.error(`Error validating commit message: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  ALLOWED_TYPES,
  validateCommitMessage
};
