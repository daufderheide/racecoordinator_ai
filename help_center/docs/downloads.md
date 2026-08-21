# 📥 Download Race Coordinator AI

Welcome to the **Race Coordinator AI** download and release portal. Download the latest installer for your operating system or explore available releases below.

---

## 🚀 Latest Version Downloads

<div id="latest-release-banner" style="margin-bottom: 1em;">
  <p><strong>Current Latest Version</strong>: <code id="latest-version-tag">v1.0.0-beta.12</code> <span id="latest-version-label"><em>(Beta Preview — Help us test upcoming features!)</em></span></p>
</div>

| Operating System | ⬇️ Direct Download Link | Version | Package Type | System Requirements |
| :--- | :--- | :--- | :--- | :--- |
| **🪟 Windows (10 / 11)** | <a id="dl-win-online" href="https://github.com/daufderheide/racecoordinator_ai/releases/download/v1.0.0-beta.12/RaceCoordinatorAI_Online_Setup_v1.0.0-beta.12.exe" class="md-button md-button--primary"><strong>⬇️ Download Windows Setup</strong></a> | <code class="latest-version-str">v1.0.0-beta.12</code> | Online Setup *(Fast, automatic component downloader)* | Windows 10 or 11 (64-bit or 32-bit), Internet connection during install |
| **🪟 Windows (8, 7, XP / Offline)** | <a id="dl-win-offline" href="https://github.com/daufderheide/racecoordinator_ai/releases/download/v1.0.0-beta.12/RaceCoordinatorAI_Offline_Setup_v1.0.0-beta.12.exe" class="md-button"><strong>⬇️ Download Offline Standalone</strong></a> | <code class="latest-version-str">v1.0.0-beta.12</code> | Full Offline Installer *(Bundled runtime)* | Windows XP SP3, 7, 8, 10, or 11; No internet required |
| **🍏 macOS (Intel & Apple Silicon)** | <a id="dl-mac" href="https://github.com/daufderheide/racecoordinator_ai/releases/download/v1.0.0-beta.12/RaceCoordinator_Mac_v1.0.0-beta.12.dmg" class="md-button"><strong>⬇️ Download macOS DMG</strong></a> | <code class="latest-version-str">v1.0.0-beta.12</code> | Universal Disk Image (`.dmg`) | macOS 10.15 (Catalina) through macOS 15+ (Intel & Apple Silicon) |
| **🐧 Linux / Raspberry Pi / Arduino Uno Q (ARM64)** | <a id="dl-linux" href="https://github.com/daufderheide/racecoordinator_ai/releases/download/v1.0.0-beta.12/RaceCoordinatorAI-Linux-ARM64_v1.0.0-beta.12.tar.gz" class="md-button"><strong>⬇️ Download Linux Package</strong></a> | <code class="latest-version-str">v1.0.0-beta.12</code> | Compressed Archive (`.tar.gz`) | Raspberry Pi OS 64-bit, Arduino Linux OS, Debian, Ubuntu ARM64 |

> 💡 **Need help installing?** Check out the [Installation & Setup Guide](installation.md) for step-by-step installation instructions for each operating system.

---

## 📦 Available Releases

Explore all currently available releases, sorted from most recent to oldest:

* 🟢 **Official Stable Releases**: Fully validated, production-ready builds recommended for all general and club race operations.
* 🟡 **Beta Previews**: Feature preview builds released during active development cycles for testing and feedback. *(Note: Beta releases for a version are retired once that version's official release is published).*

<div id="release-loading" style="padding: 1.5em; text-align: center; color: var(--md-default-fg-color--light);">
  ⏳ <em>Loading available releases from GitHub...</em>
</div>

<div id="release-container" style="display: none;">

=== "🟢 Official Releases"
    <div id="official-releases-list">
      <p><em>Loading official releases...</em></p>
    </div>

=== "🟡 Beta Previews"
    <div id="beta-releases-list">
      <p><em>Loading beta releases...</em></p>
    </div>

</div>

<noscript>
<div class="admonition note">
<p class="admonition-title">JavaScript Required for Live Catalog</p>
<p>JavaScript is disabled in your browser. You can browse all available releases directly on the <a href="https://github.com/daufderheide/racecoordinator_ai/releases">GitHub Releases Page</a>.</p>
</div>
</noscript>

---

## 🗄️ Release Archive

Looking for older legacy releases, alpha snapshot builds, or complete source code archives?

👉 **[Browse Full Release Archive on GitHub](https://github.com/daufderheide/racecoordinator_ai/releases)**

---

<script>
(function() {
  const apiUrl = 'https://api.github.com/repos/daufderheide/racecoordinator_ai/releases?per_page=100';

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatDate(isoStr) {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return isoStr.substring(0, 10);
    }
  }

  function parseVersion(tag) {
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

  function compareReleases(a, b) {
    const vA = parseVersion(a.tag_name);
    const vB = parseVersion(b.tag_name);
    if (vA.major !== vB.major) return vB.major - vA.major;
    if (vA.minor !== vB.minor) return vB.minor - vA.minor;
    if (vA.patch !== vB.patch) return vB.patch - vA.patch;
    
    if (!vA.prereleaseType && vB.prereleaseType) return -1;
    if (vA.prereleaseType && !vB.prereleaseType) return 1;

    if (vA.prereleaseNum !== vB.prereleaseNum) {
      return vB.prereleaseNum - vA.prereleaseNum;
    }

    const dateA = new Date(a.published_at || a.created_at || 0).getTime();
    const dateB = new Date(b.published_at || b.created_at || 0).getTime();
    return dateB - dateA;
  }

  function findAssets(rel) {
    let winOnline = null;
    let winOffline = null;
    let mac = null;
    let linux = null;

    if (rel.assets && rel.assets.length > 0) {
      for (const asset of rel.assets) {
        const aname = asset.name.toLowerCase();
        if (aname.includes('online') && aname.endsWith('.exe')) winOnline = asset;
        else if (aname.includes('offline') && aname.endsWith('.exe')) winOffline = asset;
        else if (aname.endsWith('.dmg')) mac = asset;
        else if (aname.includes('linux') && aname.endsWith('.tar.gz')) linux = asset;
      }
    }
    return { winOnline, winOffline, mac, linux };
  }

  function renderReleaseCard(rel) {
    const isPre = rel.prerelease;
    const tag = rel.tag_name || '';
    const name = rel.name || tag;
    const dateStr = formatDate(rel.published_at || rel.created_at);
    const { winOnline, winOffline, mac, linux } = findAssets(rel);

    let downloadButtons = '';
    if (winOnline) {
      downloadButtons += `<a href="${winOnline.browser_download_url}" class="md-button md-button--primary" style="margin: 0.25em 0.25em 0.25em 0; font-size: 0.85em;">🪟 Windows Setup (${formatBytes(winOnline.size)})</a> `;
    }
    if (winOffline) {
      downloadButtons += `<a href="${winOffline.browser_download_url}" class="md-button" style="margin: 0.25em 0.25em 0.25em 0; font-size: 0.85em;">🪟 Offline Setup (${formatBytes(winOffline.size)})</a> `;
    }
    if (mac) {
      downloadButtons += `<a href="${mac.browser_download_url}" class="md-button" style="margin: 0.25em 0.25em 0.25em 0; font-size: 0.85em;">🍏 macOS DMG (${formatBytes(mac.size)})</a> `;
    }
    if (linux) {
      downloadButtons += `<a href="${linux.browser_download_url}" class="md-button" style="margin: 0.25em 0.25em 0.25em 0; font-size: 0.85em;">🐧 Linux ARM64 (${formatBytes(linux.size)})</a> `;
    }

    if (!downloadButtons) {
      downloadButtons = `<a href="${rel.html_url}" class="md-button" style="font-size: 0.85em;">View Assets on GitHub</a>`;
    }

    return `
      <div style="border: 1px solid var(--md-default-fg-color--lightest); border-radius: 8px; padding: 1.2em; margin-bottom: 1.2em; background-color: var(--md-code-bg-color);">
        <div style="display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; margin-bottom: 0.5em;">
          <h3 style="margin: 0; font-size: 1.2em;"><strong>${name}</strong> <code style="font-size: 0.85em;">${tag}</code></h3>
          <span style="color: var(--md-default-fg-color--light); font-size: 0.9em;">📅 ${dateStr}</span>
        </div>
        <div style="margin: 0.8em 0;">
          ${downloadButtons}
        </div>
        ${rel.body ? `
          <details style="margin-top: 0.8em; font-size: 0.9em;">
            <summary style="cursor: pointer; color: var(--md-typeset-a-color);"><strong>View Release Details</strong></summary>
            <div style="padding: 0.5em 0 0 0.5em; opacity: 0.9; white-space: pre-wrap; font-family: inherit;">${rel.body.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
          </details>
        ` : ''}
      </div>
    `;
  }

  function updateLatestReleaseTable(latestRel) {
    if (!latestRel) return;
    const tag = latestRel.tag_name || '';
    const isPre = latestRel.prerelease || tag.includes('beta') || tag.includes('alpha');
    const labelText = isPre
      ? '*(Beta Preview — Help us test upcoming features!)*'
      : '*(Official Stable Release)*';

    const tagEl = document.getElementById('latest-version-tag');
    const labelEl = document.getElementById('latest-version-label');
    if (tagEl) tagEl.textContent = tag;
    if (labelEl) labelEl.innerHTML = `<em>${labelText}</em>`;

    const versionCells = document.querySelectorAll('.latest-version-str');
    versionCells.forEach(cell => {
      cell.textContent = tag;
    });

    const { winOnline, winOffline, mac, linux } = findAssets(latestRel);
    const winOnlineBtn = document.getElementById('dl-win-online');
    const winOfflineBtn = document.getElementById('dl-win-offline');
    const macBtn = document.getElementById('dl-mac');
    const linuxBtn = document.getElementById('dl-linux');

    if (winOnline && winOnlineBtn) winOnlineBtn.href = winOnline.browser_download_url;
    if (winOffline && winOfflineBtn) winOfflineBtn.href = winOffline.browser_download_url;
    if (mac && macBtn) macBtn.href = mac.browser_download_url;
    if (linux && linuxBtn) linuxBtn.href = linux.browser_download_url;
  }

  fetch(apiUrl)
    .then(res => {
      if (!res.ok) throw new Error('Status ' + res.status);
      return res.json();
    })
    .then(releases => {
      const loadingEl = document.getElementById('release-loading');
      const containerEl = document.getElementById('release-container');
      const officialList = document.getElementById('official-releases-list');
      const betaList = document.getElementById('beta-releases-list');

      if (!Array.isArray(releases) || releases.length === 0) {
        if (loadingEl) loadingEl.innerHTML = '<p>No releases found.</p>';
        return;
      }

      const officials = [];
      const betas = [];

      for (const rel of releases) {
        const tag = (rel.tag_name || '').toLowerCase();
        if (tag.includes('alpha')) {
          continue; // Alphas belong in Release Archive on GitHub
        } else if (tag.includes('beta') || rel.prerelease) {
          betas.push(rel);
        } else {
          officials.push(rel);
        }
      }

      officials.sort(compareReleases);
      betas.sort(compareReleases);

      // Determine latest between official and beta
      const candidates = [...officials, ...betas].sort(compareReleases);
      if (candidates.length > 0) {
        updateLatestReleaseTable(candidates[0]);
      }

      if (officialList) {
        officialList.innerHTML = officials.length > 0
          ? officials.map(renderReleaseCard).join('')
          : '<p style="color: var(--md-default-fg-color--light);"><em>No official stable releases published yet.</em></p>';
      }

      if (betaList) {
        betaList.innerHTML = betas.length > 0
          ? betas.map(renderReleaseCard).join('')
          : '<p style="color: var(--md-default-fg-color--light);"><em>No active beta preview releases at this time.</em></p>';
      }

      if (loadingEl) loadingEl.style.display = 'none';
      if (containerEl) containerEl.style.display = 'block';
    })
    .catch(err => {
      console.warn('Failed to load GitHub releases dynamically:', err);
      const loadingEl = document.getElementById('release-loading');
      if (loadingEl) {
        loadingEl.innerHTML = `
          <div class="admonition note">
            <p class="admonition-title">Release Catalog</p>
            <p>Direct download links for the current release are available in the table above. You can also browse all past releases on the <a href="https://github.com/daufderheide/racecoordinator_ai/releases" target="_blank" rel="noopener">GitHub Releases Page</a>.</p>
          </div>
        `;
      }
    });
})();
</script>
