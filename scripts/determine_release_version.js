const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getRootVersion() {
  const versionFile = path.resolve(__dirname, '..', 'VERSION');
  if (fs.existsSync(versionFile)) {
    const content = fs.readFileSync(versionFile, 'utf8').trim();
    if (content) return content;
  }
  const pkgFile = path.resolve(__dirname, '..', 'client', 'package.json');
  if (fs.existsSync(pkgFile)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgFile, 'utf8'));
      if (pkg.version) return pkg.version.trim();
    } catch {
      // fallback
    }
  }
  return '0.0.0';
}

function getExistingTags() {
  try {
    const output = execSync('git tag -l', { encoding: 'utf8' });
    return output.split('\n').map(t => t.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function getCommitHash() {
  if (process.env.GITHUB_SHA) {
    return process.env.GITHUB_SHA.substring(0, 7);
  }
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return '0000000';
  }
}

function normalizeVersion(ver) {
  const parts = ver.replace(/^v/, '').split('.');
  while (parts.length < 3) {
    parts.push('0');
  }
  return parts.slice(0, 3).join('.');
}

function getReleaseTitle(version, isPrerelease) {
  const isPre = isPrerelease === 'true' || isPrerelease === true;
  if (!isPre) {
    return `v${version} — Official Release`;
  }
  if (version.includes('-beta.')) {
    const parts = version.split('-beta.');
    return `v${parts[0]}-beta.${parts[1]} — Beta Preview`;
  }
  if (version.includes('-alpha.')) {
    const parts = version.split('-alpha.');
    return `v${parts[0]}-alpha.${parts[1]} — Alpha Build`;
  }
  return `v${version}`;
}

function determineVersion(eventName, ref, overrideVersion, customTags, customRootVersion, customCommitHash) {
  // 1. Manual release (workflow_dispatch) checks
  if (eventName === 'workflow_dispatch') {
    const cleanRef = (ref || '').replace(/^refs\/heads\//, '');
    if (cleanRef.startsWith('release/')) {
      throw new Error(`Manual release is not permitted on '${cleanRef}'. Releases on release branches must be triggered via git push.`);
    }

    // Explicit manual version override (e.g. from workflow_dispatch input)
    if (overrideVersion && overrideVersion.trim()) {
      const cleanVer = overrideVersion.trim().replace(/^v/, '');
      const isPrerelease = cleanVer.includes('alpha') || cleanVer.includes('beta');
      return {
        version: cleanVer,
        tag: `v${cleanVer}`,
        isPrerelease: isPrerelease ? 'true' : 'false',
        releaseTitle: getReleaseTitle(cleanVer, isPrerelease)
      };
    }

    // Manual release on main -> official production release
    if (cleanRef === 'main') {
      const rootVer = customRootVersion !== undefined ? customRootVersion : getRootVersion();
      const rootParts = rootVer.replace(/^v/, '').split('.');
      const major = rootParts[0] || '0';
      const minor = rootParts[1] || '0';
      const configuredPatch = parseInt(rootParts[2] || '0', 10);
      const prefix = `${major}.${minor}`;
      const existingTags = customTags !== undefined ? customTags : getExistingTags();

      const officialRegex = new RegExp(`^v?${major}\\.${minor}\\.(\\d+)$`);
      let maxPatch = -1;
      for (const tag of existingTags) {
        const match = tag.match(officialRegex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxPatch) maxPatch = num;
        }
      }

      const nextPatch = maxPatch === -1 ? configuredPatch : Math.max(configuredPatch, maxPatch + 1);
      const version = `${prefix}.${nextPatch}`;
      return {
        version,
        tag: `v${version}`,
        isPrerelease: 'false',
        releaseTitle: getReleaseTitle(version, false)
      };
    }

    // Default manual release on develop (or feature branch) -> vX.Y.Z-alpha.<hash>
    const rootVer = normalizeVersion(customRootVersion !== undefined ? customRootVersion : getRootVersion());
    const hash = customCommitHash !== undefined ? customCommitHash : getCommitHash();
    const version = `${rootVer}-alpha.${hash}`;
    return {
      version,
      tag: `v${version}`,
      isPrerelease: 'true',
      releaseTitle: getReleaseTitle(version, true)
    };
  }

  // 2. Explicit manual version override for non-workflow_dispatch
  if (overrideVersion && overrideVersion.trim()) {
    const cleanVer = overrideVersion.trim().replace(/^v/, '');
    const isPrerelease = cleanVer.includes('alpha') || cleanVer.includes('beta');
    return {
      version: cleanVer,
      tag: `v${cleanVer}`,
      isPrerelease: isPrerelease ? 'true' : 'false',
      releaseTitle: getReleaseTitle(cleanVer, isPrerelease)
    };
  }

  // 3. Explicit git tag push
  if (ref && ref.startsWith('refs/tags/')) {
    const rawTag = ref.replace('refs/tags/', '');
    const cleanVer = rawTag.replace(/^v/, '');
    const isPrerelease = cleanVer.includes('alpha') || cleanVer.includes('beta');
    return {
      version: cleanVer,
      tag: rawTag.startsWith('v') ? rawTag : `v${rawTag}`,
      isPrerelease: isPrerelease ? 'true' : 'false',
      releaseTitle: getReleaseTitle(cleanVer, isPrerelease)
    };
  }

  // 4. Schedule event -> Daily Alpha on develop (vX.Y.Z-alpha.YYYYMMDD)
  if (eventName === 'schedule') {
    const rootVer = normalizeVersion(customRootVersion !== undefined ? customRootVersion : getRootVersion());
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    const version = `${rootVer}-alpha.${dateStr}`;
    return {
      version,
      tag: `v${version}`,
      isPrerelease: 'true',
      releaseTitle: getReleaseTitle(version, true)
    };
  }

  const existingTags = customTags !== undefined ? customTags : getExistingTags();

  // 5. Push to release branch (e.g. refs/heads/release/v1.0.0, release/v1.0.0, release/1.0.0, release/v1.0)
  if (ref && (ref.startsWith('refs/heads/release/') || ref.startsWith('release/'))) {
    const branchName = ref.replace(/^refs\/heads\//, '').replace(/^release\//, '');
    const baseVersion = normalizeVersion(branchName); // e.g. "1.0.0"

    // Find highest beta tag: e.g. v1.0.0-beta.1, v1.0.0-beta.2
    const betaRegex = new RegExp(`^v?${baseVersion.replace(/\./g, '\\.')}-beta\\.(\\d+)$`);
    let maxBeta = 0;
    for (const tag of existingTags) {
      const match = tag.match(betaRegex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxBeta) maxBeta = num;
      }
    }
    const nextBeta = maxBeta + 1;
    const version = `${baseVersion}-beta.${nextBeta}`;
    return {
      version,
      tag: `v${version}`,
      isPrerelease: 'true',
      releaseTitle: getReleaseTitle(version, true)
    };
  }

  // 6. Push to main -> Official Production Release
  const rootVer = customRootVersion !== undefined ? customRootVersion : getRootVersion();
  const rootParts = rootVer.replace(/^v/, '').split('.');
  const major = rootParts[0] || '0';
  const minor = rootParts[1] || '0';
  const configuredPatch = parseInt(rootParts[2] || '0', 10);
  const prefix = `${major}.${minor}`;

  // Find highest official patch tag: e.g. v1.0.0, v1.0.1 (strict numbers, no alpha/beta)
  const officialRegex = new RegExp(`^v?${major}\\.${minor}\\.(\\d+)$`);
  let maxPatch = -1;
  for (const tag of existingTags) {
    const match = tag.match(officialRegex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxPatch) maxPatch = num;
    }
  }

  const nextPatch = maxPatch === -1 ? configuredPatch : Math.max(configuredPatch, maxPatch + 1);
  const version = `${prefix}.${nextPatch}`;
  return {
    version,
    tag: `v${version}`,
    isPrerelease: 'false',
    releaseTitle: getReleaseTitle(version, false)
  };
}

function main() {
  const eventName = process.env.GITHUB_EVENT_NAME || '';
  const ref = process.env.GITHUB_REF || '';
  const overrideVersion = process.env.INPUT_VERSION || process.env.VERSION || '';

  try {
    const result = determineVersion(eventName, ref, overrideVersion);

    console.log(`Calculated Release:`);
    console.log(`  Version:       ${result.version}`);
    console.log(`  Tag:           ${result.tag}`);
    console.log(`  Is Prerelease: ${result.isPrerelease}`);
    console.log(`  Release Title: ${result.releaseTitle}`);

    const githubOutput = process.env.GITHUB_OUTPUT;
    if (githubOutput) {
      fs.appendFileSync(githubOutput, `version=${result.version}\n`);
      fs.appendFileSync(githubOutput, `tag=${result.tag}\n`);
      fs.appendFileSync(githubOutput, `is_prerelease=${result.isPrerelease}\n`);
      fs.appendFileSync(githubOutput, `release_title=${result.releaseTitle}\n`);
    }
  } catch (err) {
    console.error(`Error determining release version: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  getRootVersion,
  getExistingTags,
  getCommitHash,
  normalizeVersion,
  determineVersion,
  getReleaseTitle
};
