const fs = require('fs');
const path = require('path');

function generateDownloadSection(tag, isPrerelease) {
  if (tag.includes('alpha')) {
    throw new Error(`Alpha builds (${tag}) cannot update the main README download section.`);
  }
  const isPre = isPrerelease === 'true' || isPrerelease === true || tag.includes('beta');
  const typeLabel = isPre ? '*(Beta Preview — Help us test upcoming features!)*' : '*(Official Stable Release)*';
  const baseUrl = `https://github.com/daufderheide/racecoordinator_ai/releases/download/${tag}`;

  const winOnline = `${baseUrl}/RaceCoordinatorAI_Online_Setup_${tag}.exe`;
  const winOffline = `${baseUrl}/RaceCoordinatorAI_Offline_Setup_${tag}.exe`;
  const macDmg = `${baseUrl}/RaceCoordinator_Mac_${tag}.dmg`;
  const linuxTar = `${baseUrl}/RaceCoordinatorAI-Linux-ARM64_${tag}.tar.gz`;

  return `<!-- DOWNLOAD_SECTION_START -->
## 📥 Download Race Coordinator AI

> 🚀 **Current Latest Version**: **\`${tag}\`** ${typeLabel}

Click your operating system below to **download directly**:

| Operating System | ⬇️ Direct Download Link | Version | Package Type |
| :--- | :--- | :--- | :--- |
| **🪟 Windows (10 / 11)** | [**⬇️ Download Windows Setup**](${winOnline}) | \`${tag}\` | Online Setup *(Fast, requires internet)* |
| **🪟 Windows (8, 7, XP / Offline)** | [**⬇️ Download Offline Setup**](${winOffline}) | \`${tag}\` | Full Offline Standalone *(Required for Win 8 & older)* |
| **🍏 macOS (Intel & Apple Silicon)** | [**⬇️ Download macOS DMG**](${macDmg}) | \`${tag}\` | Disk Image (\`.dmg\`) |
| **🐧 Linux / Raspberry Pi / Arduino Uno Q (ARM64)** | [**⬇️ Download Linux Package**](${linuxTar}) | \`${tag}\` | Tarball (\`.tar.gz\`) |

---

### 🌐 Downloads & Documentation
* 📋 **[Release Notes & Changelog](https://daufderheide.github.io/racecoordinator_ai/changelog/)** — Detailed list of features, bug fixes, and release history.
* 📦 **[Help Center Downloads & Release Portal](https://daufderheide.github.io/racecoordinator_ai/downloads/)** — Explore all releases (Official, Beta, Alpha) and downloads.
* 📖 **[Installation Guide & System Requirements](https://daufderheide.github.io/racecoordinator_ai/installation/)** — Detailed step-by-step setup guides for each platform.
<!-- DOWNLOAD_SECTION_END -->`;
}

function updateReadmeContent(content, tag, isPrerelease) {
  const newSection = generateDownloadSection(tag, isPrerelease);
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

function updateReadmeFile(readmePath, tag, isPrerelease) {
  if (!fs.existsSync(readmePath)) {
    throw new Error(`README file not found at: ${readmePath}`);
  }
  const content = fs.readFileSync(readmePath, 'utf8');
  const updated = updateReadmeContent(content, tag, isPrerelease);
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
  generateDownloadSection,
  updateReadmeContent,
  updateReadmeFile
};
