const { test, describe } = require('node:test');
const assert = require('node:assert');
const { generateDownloadSection, updateReadmeContent } = require('./update_readme_downloads');

describe('update_readme_downloads', () => {
  describe('generateDownloadSection', () => {
    test('should generate download section for beta prereleases', () => {
      const section = generateDownloadSection('v1.0.0-beta.4', true);
      assert.ok(section.includes('v1.0.0-beta.4'));
      assert.ok(section.includes('*(Beta Preview — Help us test upcoming features!)*'));
      assert.ok(section.includes('https://github.com/daufderheide/racecoordinator_ai/releases/download/v1.0.0-beta.4/RaceCoordinatorAI_Online_Setup_v1.0.0-beta.4.exe'));
      assert.ok(section.includes('https://github.com/daufderheide/racecoordinator_ai/releases/download/v1.0.0-beta.4/RaceCoordinator_Mac_v1.0.0-beta.4.dmg'));
      assert.ok(section.includes('https://github.com/daufderheide/racecoordinator_ai/releases/download/v1.0.0-beta.4/RaceCoordinatorAI-Linux-ARM64_v1.0.0-beta.4.tar.gz'));
    });

    test('should generate download section for official stable releases', () => {
      const section = generateDownloadSection('v1.0.0', false);
      assert.ok(section.includes('v1.0.0'));
      assert.ok(section.includes('*(Official Stable Release)*'));
      assert.ok(section.includes('https://github.com/daufderheide/racecoordinator_ai/releases/download/v1.0.0/RaceCoordinatorAI_Online_Setup_v1.0.0.exe'));
    });
  });

  describe('updateReadmeContent', () => {
    test('should replace content between section markers', () => {
      const initial = `# 🏎️ Race Coordinator AI

<!-- DOWNLOAD_SECTION_START -->
Old content here
<!-- DOWNLOAD_SECTION_END -->

## 🚀 Quick Start Guide
`;
      const updated = updateReadmeContent(initial, 'v1.0.0-beta.5', true);
      assert.ok(updated.includes('v1.0.0-beta.5'));
      assert.ok(!updated.includes('Old content here'));
      assert.ok(updated.includes('## 🚀 Quick Start Guide'));
    });

    test('should fallback and replace existing download section if markers are missing', () => {
      const initial = `# 🏎️ Race Coordinator AI

## 📥 Download Race Coordinator AI

Old un-marked download table

## 🚀 Quick Start Guide
`;
      const updated = updateReadmeContent(initial, 'v1.0.0', false);
      assert.ok(updated.includes('<!-- DOWNLOAD_SECTION_START -->'));
      assert.ok(updated.includes('<!-- DOWNLOAD_SECTION_END -->'));
      assert.ok(updated.includes('v1.0.0'));
      assert.ok(updated.includes('## 🚀 Quick Start Guide'));
    });
  });
});
