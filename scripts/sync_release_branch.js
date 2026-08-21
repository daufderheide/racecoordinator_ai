const { execSync } = require('child_process');
const fs = require('fs');

/**
 * Finds all active release branches in the repository.
 *
 * @param {string[]} [customBranchList] Optional mock branch list for testing.
 * @param {Function} [customExec] Optional execSync implementation.
 * @returns {string[]} List of release branch names (e.g. ['release/v1.0.0']).
 */
function getActiveReleaseBranches(customBranchList, customExec) {
  if (customBranchList) {
    return parseReleaseBranches(customBranchList);
  }

  const exec = customExec || execSync;
  try {
    const output = exec('git branch -a --list "*release/*"', { encoding: 'utf8' });
    const lines = output.split('\n');
    return parseReleaseBranches(lines);
  } catch {
    return [];
  }
}

/**
 * Parses raw git branch lines into clean unique release branch identifiers.
 *
 * @param {string[]} lines
 * @returns {string[]}
 */
function parseReleaseBranches(lines) {
  const branches = new Set();
  for (let line of lines) {
    line = line.trim().replace(/^[*+]\s+/, '');
    if (!line) continue;
    // Remove remote prefix (e.g., remotes/origin/ or origin/)
    line = line.replace(/^remotes\/origin\//, '').replace(/^origin\//, '');
    if (line.startsWith('release/')) {
      branches.add(line);
    }
  }

  // Sort by semantic version descending if possible
  return Array.from(branches).sort((a, b) => {
    const verA = a.replace(/^release\/(v)?/, '');
    const verB = b.replace(/^release\/(v)?/, '');
    return verB.localeCompare(verA, undefined, { numeric: true, sensitivity: 'base' });
  });
}

/**
 * Counts unmerged commits on a release branch not yet present in develop.
 *
 * @param {string} releaseBranch (e.g. 'origin/release/v1.0.0' or 'release/v1.0.0')
 * @param {string} [targetBranch='develop']
 * @param {Function} [customExec]
 * @returns {number} Number of commits
 */
function getUnmergedCommitCount(releaseBranch, targetBranch = 'develop', customExec) {
  const exec = customExec || execSync;
  try {
    const countStr = exec(`git rev-list --count "${targetBranch}..${releaseBranch}"`, {
      encoding: 'utf8'
    }).trim();
    return parseInt(countStr, 10) || 0;
  } catch {
    return 0;
  }
}

/**
 * Checks if merging releaseBranch into targetBranch would result in conflicts.
 * Uses git merge-tree or git merge-base to test without altering working tree.
 *
 * @param {string} releaseBranch
 * @param {string} [targetBranch='develop']
 * @param {Function} [customExec]
 * @returns {boolean} true if merge produces conflicts, false otherwise.
 */
function checkHasMergeConflict(releaseBranch, targetBranch = 'develop', customExec) {
  const exec = customExec || execSync;
  try {
    // Check if git merge-tree can simulate the 3-way merge cleanly
    const mergeBase = exec(`git merge-base "${targetBranch}" "${releaseBranch}"`, {
      encoding: 'utf8'
    }).trim();
    if (!mergeBase) return false;

    const treeOutput = exec(`git merge-tree "${mergeBase}" "${targetBranch}" "${releaseBranch}"`, {
      encoding: 'utf8'
    });

    // If merge-tree output contains conflict markers, there is a conflict
    return treeOutput.includes('<<<<<<<') || treeOutput.includes('changed in both');
  } catch {
    // If command fails, assume safe or handle error
    return false;
  }
}

/**
 * Inspects all release branches and calculates overall sync status.
 *
 * @param {Object} options
 * @returns {Object}
 */
function checkSyncStatus(options = {}) {
  const customBranches = options.branches;
  const customExec = options.exec;
  const targetBranch = options.targetBranch || 'develop';

  const releaseBranches = getActiveReleaseBranches(customBranches, customExec);
  if (releaseBranches.length === 0) {
    return {
      hasReleaseBranch: false,
      activeReleaseBranch: '',
      unmergedCount: 0,
      hasUnmergedCommits: false,
      hasConflict: false,
      status: 'NO_RELEASE_BRANCH'
    };
  }

  // Inspect the latest active release branch
  const activeReleaseBranch = releaseBranches[0];
  const unmergedCount = getUnmergedCommitCount(activeReleaseBranch, targetBranch, customExec);
  const hasUnmergedCommits = unmergedCount > 0;
  const hasConflict = hasUnmergedCommits
    ? checkHasMergeConflict(activeReleaseBranch, targetBranch, customExec)
    : false;

  let status = 'SYNCED';
  if (hasUnmergedCommits) {
    status = hasConflict ? 'CONFLICT' : 'PENDING_MERGE';
  }

  return {
    hasReleaseBranch: true,
    activeReleaseBranch,
    allReleaseBranches: releaseBranches,
    unmergedCount,
    hasUnmergedCommits,
    hasConflict,
    status
  };
}

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check-only');

  const status = checkSyncStatus();

  console.log('--- Release Branch Sync Status ---');
  console.log(`Active Release Branch: ${status.activeReleaseBranch || 'None'}`);
  console.log(`Unmerged Commits to develop: ${status.unmergedCount}`);
  console.log(`Has Conflict: ${status.hasConflict}`);
  console.log(`Overall Status: ${status.status}`);
  console.log('----------------------------------');

  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    fs.appendFileSync(githubOutput, `has_release_branch=${status.hasReleaseBranch}\n`);
    fs.appendFileSync(githubOutput, `active_release_branch=${status.activeReleaseBranch}\n`);
    fs.appendFileSync(githubOutput, `unmerged_count=${status.unmergedCount}\n`);
    fs.appendFileSync(githubOutput, `has_unmerged_commits=${status.hasUnmergedCommits}\n`);
    fs.appendFileSync(githubOutput, `has_conflict=${status.hasConflict}\n`);
    fs.appendFileSync(githubOutput, `sync_status=${status.status}\n`);
  }

  if (checkOnly) {
    if (status.status === 'CONFLICT') {
      console.error('ERROR: Unmerged commits exist with merge conflict between release and develop.');
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getActiveReleaseBranches,
  parseReleaseBranches,
  getUnmergedCommitCount,
  checkHasMergeConflict,
  checkSyncStatus
};
