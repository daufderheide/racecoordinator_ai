const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO_URL = 'https://github.com/daufderheide/racecoordinator_ai';

function getExistingTags() {
  try {
    const output = execSync('git tag -l', { encoding: 'utf8' });
    return output.split('\n').map(t => t.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function parseSemver(tag) {
  const match = (tag || '').match(/^v?(\d+)\.(\d+)(?:\.(\d+))?(?:-([a-zA-Z]+)(?:\.(\d+))?)?/);
  if (!match) return { major: 0, minor: 0, patch: 0, prereleaseType: null, prereleaseNum: 0, raw: tag };
  return {
    major: parseInt(match[1], 10) || 0,
    minor: parseInt(match[2], 10) || 0,
    patch: parseInt(match[3], 10) || 0,
    prereleaseType: match[4] || null,
    prereleaseNum: match[5] ? parseInt(match[5], 10) : 0,
    raw: tag
  };
}

function compareSemver(a, b) {
  const vA = parseSemver(a);
  const vB = parseSemver(b);
  if (vA.major !== vB.major) return vB.major - vA.major;
  if (vA.minor !== vB.minor) return vB.minor - vA.minor;
  if (vA.patch !== vB.patch) return vB.patch - vA.patch;

  if (!vA.prereleaseType && vB.prereleaseType) return -1;
  if (vA.prereleaseType && !vB.prereleaseType) return 1;

  if (vA.prereleaseNum !== vB.prereleaseNum) {
    return vB.prereleaseNum - vA.prereleaseNum;
  }
  return 0;
}

function findPreviousTag(currentTag, isPrerelease, customTags) {
  const tags = customTags !== undefined ? customTags : getExistingTags();
  const currentParsed = parseSemver(currentTag);
  const isPre = isPrerelease === 'true' || isPrerelease === true || currentTag.includes('beta') || currentTag.includes('alpha');

  if (!isPre) {
    // For official release: look for previous highest official release strictly older than currentTag
    const officialTags = tags.filter(t => {
      const p = parseSemver(t);
      if (p.prereleaseType) return false;
      // Must be strictly older than currentTag
      return compareSemver(currentTag, t) < 0;
    }).sort(compareSemver);

    return officialTags.length > 0 ? officialTags[0] : null;
  } else {
    // For beta/prerelease: look for any release tag strictly older than currentTag
    const olderTags = tags.filter(t => {
      if (t === currentTag) return false;
      return compareSemver(currentTag, t) < 0;
    }).sort(compareSemver);

    return olderTags.length > 0 ? olderTags[0] : null;
  }
}

function getCommits(fromTag, toRef) {
  try {
    const range = fromTag ? `${fromTag}..${toRef || 'HEAD'}` : (toRef || 'HEAD');
    const cmd = `git log ${range} --pretty=format:"%h|%s|%an"`;
    const output = execSync(cmd, { encoding: 'utf8' }).trim();
    if (!output) return [];

    return output.split('\n').map(line => {
      const parts = line.split('|');
      const hash = parts[0] ? parts[0].trim() : '';
      const author = parts.length > 2 ? parts.slice(2).join('|').trim() : '';
      const subject = parts[1] ? parts[1].trim() : '';
      return { hash, subject, author };
    }).filter(c => c.hash && c.subject);
  } catch {
    return [];
  }
}

function formatInitialReleaseSection() {
  return `### 🎉 Initial Official Release

Welcome to the first official release of **Race Coordinator AI**!

- **Track & Hardware Management**: Comprehensive track editor, lane configuration, and pin mapping for Arduino UNO Q, Phidgets, and custom serial interfaces.
- **Race Engine & Predictions**: Advanced race formats, rotations, driver scoring, live telemetry, and AI predictions.
- **Customizable UI & Audio**: Modular race day dashboard, visual themes, sound effects, and text-to-speech race commentary.
- **Cross-Platform**: Support for Windows (Online & Offline Standalone), macOS (Apple Silicon & Intel DMG), and Linux ARM64.

Explore the complete [Help Center Documentation & Guides](https://daufderheide.github.io/racecoordinator_ai/) to get started.`;
}

function formatBetaCommitList(commits, previousTag) {
  if (!commits || commits.length === 0) {
    const prevNote = previousTag ? ` since \`${previousTag}\`` : '';
    return `### 📋 Beta Changes & Commits\n\n*No additional code commits recorded${prevNote}.*`;
  }

  const prevText = previousTag ? ` since \`${previousTag}\`` : '';
  const lines = commits.map(c => {
    const commitLink = `[\`${c.hash}\`](${REPO_URL}/commit/${c.hash})`;
    const authorStr = c.author ? ` *(${c.author})*` : '';
    return `- ${commitLink} ${c.subject}${authorStr}`;
  });

  return `### 📋 Beta Changes & Commits\n\nChanges included in this preview build${prevText}:\n\n${lines.join('\n')}`;
}

function formatOfficialReleaseNotes(commits, previousTag, isBeta = false) {
  const features = [];
  const bugFixes = [];
  const improvements = [];

  const noisePrefixes = ['chore:', 'test:', 'screendiff:', 'ci:', 'docs:', 'style:', 'build:'];

  for (const c of commits) {
    const subject = c.subject.trim();

    // Check noise
    const lower = subject.toLowerCase();
    if (noisePrefixes.some(np => lower.startsWith(np) || lower.startsWith(`${np}(`))) {
      continue;
    }
    if (lower.startsWith('merge branch') || lower.startsWith('merge remote-tracking') || lower.startsWith('merge pull request')) {
      continue;
    }

    const commitLink = `([${c.hash}](${REPO_URL}/commit/${c.hash}))`;

    // Conventional match
    const featMatch = subject.match(/^feat(?:\(([^)]+)\))?!?:\s*(.+)$/i);
    const fixMatch = subject.match(/^fix(?:\(([^)]+)\))?!?:\s*(.+)$/i);
    const perfMatch = subject.match(/^(?:perf|refactor)(?:\(([^)]+)\))?!?:\s*(.+)$/i);

    if (featMatch) {
      const rawScope = featMatch[1] ? featMatch[1].trim() : '';
      if (!isBeta && rawScope.toLowerCase() === 'beta') {
        continue; // Exclude beta-scoped features from official release notes
      }
      const scopePrefix = rawScope ? `**${rawScope}**: ` : '';
      const text = featMatch[2].trim();
      features.push(`- ${scopePrefix}${text} ${commitLink}`);
    } else if (fixMatch) {
      const rawScope = fixMatch[1] ? fixMatch[1].trim() : '';
      if (!isBeta && rawScope.toLowerCase() === 'beta') {
        continue; // Exclude beta-scoped fixes from official release notes
      }
      const scopePrefix = rawScope ? `**${rawScope}**: ` : '';
      const text = fixMatch[2].trim();
      bugFixes.push(`- ${scopePrefix}${text} ${commitLink}`);
    } else if (perfMatch) {
      const rawScope = perfMatch[1] ? perfMatch[1].trim() : '';
      if (!isBeta && rawScope.toLowerCase() === 'beta') {
        continue; // Exclude beta-scoped improvements from official release notes
      }
      const scopePrefix = rawScope ? `**${rawScope}**: ` : '';
      const text = perfMatch[2].trim();
      improvements.push(`- ${scopePrefix}${text} ${commitLink}`);
    } else if (/^add\s+/i.test(subject) || /^implement\s+/i.test(subject) || /^support\s+/i.test(subject)) {
      features.push(`- ${subject} ${commitLink}`);
    } else if (/^fix\s+/i.test(subject) || /^resolve\s+/i.test(subject) || /^correct\s+/i.test(subject)) {
      bugFixes.push(`- ${subject} ${commitLink}`);
    }
  }

  const sections = [];

  if (features.length > 0) {
    sections.push(`### 🚀 New Features\n\n${features.join('\n')}`);
  }
  if (bugFixes.length > 0) {
    sections.push(`### 🐛 Bug Fixes\n\n${bugFixes.join('\n')}`);
  }
  if (improvements.length > 0) {
    sections.push(`### ⚡ Improvements & Refactoring\n\n${improvements.join('\n')}`);
  }

  if (sections.length === 0) {
    return `### 🛠️ Updates & Maintenance\n\n- General maintenance, stability enhancements, and updated dependencies.`;
  }

  return sections.join('\n\n');
}

function generateChangelog(tag, isPrerelease, options = {}) {
  const isPre = isPrerelease === 'true' || isPrerelease === true || tag.includes('beta') || tag.includes('alpha');
  const overrideNotes = options.overrideNotes || (options.overrideFile && fs.existsSync(options.overrideFile) ? fs.readFileSync(options.overrideFile, 'utf8').trim() : '');

  if (overrideNotes) {
    return overrideNotes;
  }

  const previousTag = options.customPreviousTag !== undefined
    ? options.customPreviousTag
    : findPreviousTag(tag, isPre, options.customTags);

  const rawVer = tag.replace(/^v/, '');

  // 1. Initial official release (v1.0.0) without previous official tag
  if (!isPre && (rawVer === '1.0.0' || !previousTag)) {
    return formatInitialReleaseSection();
  }

  // 2. Beta & Official releases: filtered conventional changelist
  const commits = options.customCommits !== undefined
    ? options.customCommits
    : getCommits(previousTag, options.toRef || tag);

  let notes = formatOfficialReleaseNotes(commits, previousTag, isPre);

  if (previousTag) {
    notes += `\n\n<details>\n<summary>🔍 <b>Full Commit History</b></summary>\n\n<p>View full commit comparison on <a href="${REPO_URL}/compare/${previousTag}...${tag}">GitHub</a></p>\n</details>`;
  }

  return notes;
}

function updateChangelogMarkdown(filePath, tag, releaseNotes, dateStr) {
  const date = dateStr || new Date().toISOString().substring(0, 10);
  const newEntry = `## [${tag}] - ${date}\n\n${releaseNotes}\n`;

  if (!fs.existsSync(filePath)) {
    const initialContent = `# Changelog\n\nAll notable changes to Race Coordinator AI are documented in this file.\n\n${newEntry}\n`;
    fs.writeFileSync(filePath, initialContent, 'utf8');
    return initialContent;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(`## [${tag}]`)) {
    return content; // already recorded
  }

  const headerRegex = /(# Changelog[\s\S]*?\n\n)/;
  if (headerRegex.test(content)) {
    const updated = content.replace(headerRegex, `$1${newEntry}\n`);
    fs.writeFileSync(filePath, updated, 'utf8');
    return updated;
  }

  const updated = `# Changelog\n\n${newEntry}\n${content}`;
  fs.writeFileSync(filePath, updated, 'utf8');
  return updated;
}

function main() {
  const tag = process.argv[2] || process.env.TAG || 'v1.0.0';
  const isPrerelease = process.argv[3] || process.env.IS_PRERELEASE || 'false';
  const overrideNotes = process.env.RELEASE_NOTES_OVERRIDE || '';
  const repoRoot = process.env.GITHUB_WORKSPACE || process.cwd();
  const overrideFile = path.resolve(repoRoot, 'RELEASE_NOTES.md');

  try {
    const notes = generateChangelog(tag, isPrerelease, {
      overrideNotes,
      overrideFile,
      toRef: tag
    });

    console.log(`Generated Changelog for ${tag}:\n`);
    console.log(notes);

    // Save changelog snippet for GitHub Action release_body.md
    const snippetPath = path.resolve(repoRoot, 'changelog_snippet.md');
    fs.writeFileSync(snippetPath, notes, 'utf8');

    // Update root CHANGELOG.md and help center changelog.md if official or beta
    if (!tag.includes('alpha')) {
      const rootChangelog = path.resolve(repoRoot, 'CHANGELOG.md');
      const docsChangelog = path.resolve(repoRoot, 'help_center', 'docs', 'changelog.md');
      updateChangelogMarkdown(rootChangelog, tag, notes);
      updateChangelogMarkdown(docsChangelog, tag, notes);
    }
  } catch (err) {
    console.error(`Error generating changelog: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  findPreviousTag,
  parseSemver,
  compareSemver,
  formatInitialReleaseSection,
  formatBetaCommitList,
  formatOfficialReleaseNotes,
  generateChangelog,
  updateChangelogMarkdown
};
