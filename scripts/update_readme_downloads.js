const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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

function getOfficialReleasesToShow(tags) {
  const officialTags = tags.filter(t => {
    const p = parseSemver(t);
    return !p.prereleaseType && p.major >= 1 && /^v?\d+\.\d+\.\d+$/.test(t);
  });

  const lineMap = new Map();
  for (const tag of officialTags) {
    const p = parseSemver(tag);
    const lineKey = `${p.major}.${p.minor}`;
    if (!lineMap.has(lineKey)) {
      lineMap.set(lineKey, tag);
    } else {
      const current = lineMap.get(lineKey);
      if (compareSemver(tag, current) < 0) {
        lineMap.set(lineKey, tag);
      }
    }
  }

  const selected = Array.from(lineMap.values());
  selected.sort(compareSemver);
  return selected;
}

function getLatestBetaRelease(tags) {
  const betaTags = tags.filter(t => {
    const p = parseSemver(t);
    return p.prereleaseType === 'beta' && p.major >= 1;
  });

  if (betaTags.length === 0) return null;

  betaTags.sort(compareSemver);
  return betaTags[0];
}

function renderDownloadTable(tag) {
  const baseUrl = `https://github.com/daufderheide/racecoordinator_ai/releases/download/${tag}`;
  const winOnline = `${baseUrl}/RaceCoordinatorAI_Online_Setup_${tag}.exe`;
  const winOffline = `${baseUrl}/RaceCoordinatorAI_Offline_Setup_${tag}.exe`;
  const macDmg = `${baseUrl}/RaceCoordinator_Mac_${tag}.dmg`;
  const linuxTar = `${baseUrl}/RaceCoordinatorAI-Linux-ARM64_${tag}.tar.gz`;

  return `| Operating System | ⬇️ Direct Download Link | Version | Package Type |
| :--- | :--- | :--- | :--- |
| **🪟 Windows (10 / 11)** | [**⬇️ Download Windows Setup**](${winOnline}) | \`${tag}\` | Online Setup *(Fast, requires internet)* |
| **🪟 Windows (8, 7, XP / Offline)** | [**⬇️ Download Offline Setup**](${winOffline}) | \`${tag}\` | Full Offline Standalone *(Required for Win 8 & older)* |
| **🍏 macOS (Intel & Apple Silicon)** | [**⬇️ Download macOS DMG**](${macDmg}) | \`${tag}\` | Disk Image (\`.dmg\`) |
| **🐧 Linux / Raspberry Pi / Arduino Uno Q (ARM64)** | [**⬇️ Download Linux Package**](${linuxTar}) | \`${tag}\` | Tarball (\`.tar.gz\`) |`;
}

function generateDownloadSection(tag, isPrerelease, options = {}) {
  if (tag && tag.includes('alpha')) {
    throw new Error(`Alpha builds (${tag}) cannot update the main README download section.`);
  }

  const existingTags = options.customTags !== undefined ? options.customTags : getExistingTags();
  const allTags = Array.from(new Set([tag, ...existingTags].filter(Boolean)));

  const officialReleases = getOfficialReleasesToShow(allTags);
  const latestBeta = getLatestBetaRelease(allTags);

  let officialContent = '';
  if (officialReleases.length === 0) {
    const fallbackTag = (!tag || tag.includes('beta')) ? 'v1.0.0' : tag;
    const notesUrl = `https://github.com/daufderheide/racecoordinator_ai/releases/tag/${fallbackTag}`;
    officialContent = `#### Release \`${fallbackTag}\` *(Official Stable Release)* · [📋 Release Notes](${notesUrl})\n\n${renderDownloadTable(fallbackTag)}`;
  } else {
    const sections = officialReleases.map((ver, idx) => {
      const isLatest = idx === 0 ? ' *(Official Stable Release)*' : '';
      const notesUrl = `https://github.com/daufderheide/racecoordinator_ai/releases/tag/${ver}`;
      return `#### Release \`${ver}\`${isLatest} · [📋 Release Notes](${notesUrl})\n\n${renderDownloadTable(ver)}`;
    });
    officialContent = sections.join('\n\n');
  }

  let betaSection = '';
  const isPre = isPrerelease === 'true' || isPrerelease === true || (tag && tag.includes('beta'));
  const betaToDisplay = (isPre && tag && tag.includes('beta')) ? tag : latestBeta;
  if (betaToDisplay) {
    const notesUrl = `https://github.com/daufderheide/racecoordinator_ai/releases/tag/${betaToDisplay}`;
    betaSection = `---

### 🧪 Beta Preview Releases

> ⚠️ **Beta Releases** *(Beta Preview — Help us test upcoming features!)* contain upcoming features and bug fixes for testing and community feedback. These builds may be less stable than official releases. If you are hosting a race event, please use an **Official Stable Release** above.

#### Release \`${betaToDisplay}\` *(Beta Preview)* · [📋 Release Notes](${notesUrl})

${renderDownloadTable(betaToDisplay)}

`;
  }

  return `<!-- DOWNLOAD_SECTION_START -->
## 📥 Download Race Coordinator AI

### 🟢 Official Stable Releases

> **Recommended for all general users and race events.** These releases are thoroughly tested and production-ready.

${officialContent}

${betaSection}---

### 🌐 Downloads & Documentation
* 📋 **[Release Notes & Changelog](https://daufderheide.github.io/racecoordinator_ai/changelog/)** — Detailed list of features, bug fixes, and release history.
* 📦 **[Help Center Downloads & Release Portal](https://daufderheide.github.io/racecoordinator_ai/downloads/)** — Explore all releases (Official, Beta, Alpha) and downloads.
* 📖 **[Installation Guide & System Requirements](https://daufderheide.github.io/racecoordinator_ai/installation/)** — Detailed step-by-step setup guides for each platform.
<!-- DOWNLOAD_SECTION_END -->`;
}

function updateReadmeContent(content, tag, isPrerelease, options = {}) {
  const newSection = generateDownloadSection(tag, isPrerelease, options);
  const regex = /<!-- DOWNLOAD_SECTION_START -->[\s\S]*?<!-- DOWNLOAD_SECTION_END -->/;

  if (regex.test(content)) {
    return content.replace(regex, newSection);
  }

  // Fallback: replace existing Download section if markers aren't present yet
  const fallbackRegex = /## 📥 Download Race Coordinator AI[\s\S]*?(?=### 💡 Which file should I download\?|## 🚀 Quick Start Guide|$)/;
  if (fallbackRegex.test(content)) {
    return content.replace(fallbackRegex, `${newSection}\n\n`);
  }

  return content;
}

function updateReadmeFile(readmePath, tag, isPrerelease, options = {}) {
  if (!fs.existsSync(readmePath)) {
    throw new Error(`README file not found at: ${readmePath}`);
  }
  const content = fs.readFileSync(readmePath, 'utf8');
  const updated = updateReadmeContent(content, tag, isPrerelease, options);
  fs.writeFileSync(readmePath, updated, 'utf8');
  return updated;
}

function main() {
  const tag = process.argv[2] || process.env.TAG;
  const isPrerelease = process.argv[3] || process.env.IS_PRERELEASE;

  if (!tag) {
    console.error('Usage: node update_readme_downloads.js <tag> [isPrerelease]');
    process.exit(1);
  }

  if (tag.includes('alpha')) {
    console.log(`Skipping README update: ${tag} is an alpha/daily build and should not update main README.`);
    process.exit(0);
  }

  const repoRoot = process.env.GITHUB_WORKSPACE || process.cwd();
  const readmePath = path.resolve(repoRoot, 'README.md');
  updateReadmeFile(readmePath, tag, isPrerelease);
  console.log(`Updated README.md with download links for tag: ${tag}`);
}

if (require.main === module) {
  main();
}

module.exports = {
  getExistingTags,
  parseSemver,
  compareSemver,
  getOfficialReleasesToShow,
  getLatestBetaRelease,
  renderDownloadTable,
  generateDownloadSection,
  updateReadmeContent,
  updateReadmeFile
};
