const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { generateDownloadSection, updateReadmeContent, updateReadmeFile } = require('./update_readme_downloads');

describe('update_readme_downloads', () => {
  describe('generateDownloadSection', () => {
    test('should generate download section for beta prereleases', () => {
      const section = generateDownloadSection('v1.0.0-beta.7', true);
      assert.ok(section.includes('v1.0.0-beta.7'));
      assert.ok(section.includes('*(Beta Preview — Help us test upcoming features!)*'));
      assert.ok(section.includes('🐧 Linux / Raspberry Pi / Arduino Uno Q (ARM64)'));
      assert.ok(section.includes('https://github.com/daufderheide/racecoordinator_ai/releases/download/v1.0.0-beta.7/RaceCoordinatorAI_Online_Setup_v1.0.0-beta.7.exe'));
      assert.ok(section.includes('https://github.com/daufderheide/racecoordinator_ai/releases/download/v1.0.0-beta.7/RaceCoordinatorAI_Offline_Setup_v1.0.0-beta.7.exe'));
      assert.ok(section.includes('https://github.com/daufderheide/racecoordinator_ai/releases/download/v1.0.0-beta.7/RaceCoordinator_Mac_v1.0.0-beta.7.dmg'));
      assert.ok(section.includes('https://github.com/daufderheide/racecoordinator_ai/releases/download/v1.0.0-beta.7/RaceCoordinatorAI-Linux-ARM64_v1.0.0-beta.7.tar.gz'));
      assert.ok(section.includes('https://daufderheide.github.io/racecoordinator_ai/changelog/'));
      assert.ok(section.includes('https://daufderheide.github.io/racecoordinator_ai/downloads/'));
      assert.ok(section.includes('https://daufderheide.github.io/racecoordinator_ai/installation/'));
    });

    test('should generate download section for official stable releases', () => {
      const section = generateDownloadSection('v1.0.0', false);
      assert.ok(section.includes('v1.0.0'));
      assert.ok(section.includes('*(Official Stable Release)*'));
      assert.ok(section.includes('🐧 Linux / Raspberry Pi / Arduino Uno Q (ARM64)'));
      assert.ok(section.includes('https://github.com/daufderheide/racecoordinator_ai/releases/download/v1.0.0/RaceCoordinatorAI_Online_Setup_v1.0.0.exe'));
      assert.ok(section.includes('https://github.com/daufderheide/racecoordinator_ai/releases/download/v1.0.0/RaceCoordinatorAI_Offline_Setup_v1.0.0.exe'));
      assert.ok(section.includes('https://github.com/daufderheide/racecoordinator_ai/releases/download/v1.0.0/RaceCoordinator_Mac_v1.0.0.dmg'));
      assert.ok(section.includes('https://github.com/daufderheide/racecoordinator_ai/releases/download/v1.0.0/RaceCoordinatorAI-Linux-ARM64_v1.0.0.tar.gz'));
      assert.ok(section.includes('https://daufderheide.github.io/racecoordinator_ai/changelog/'));
      assert.ok(section.includes('https://daufderheide.github.io/racecoordinator_ai/downloads/'));
      assert.ok(section.includes('https://daufderheide.github.io/racecoordinator_ai/installation/'));
    });

    test('should reject alpha tags and throw an error', () => {
      assert.throws(() => {
        generateDownloadSection('v1.0.0-alpha.20260819', true);
      }, /Alpha builds \(v1\.0\.0-alpha\.20260819\) cannot update the main README/);
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
      const updated = updateReadmeContent(initial, 'v1.0.0-beta.8', true);
      assert.ok(updated.includes('v1.0.0-beta.8'));
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

  describe('updateReadmeFile', () => {
    test('should throw error if file does not exist', () => {
      assert.throws(() => {
        updateReadmeFile('/non/existent/path/README.md', 'v1.0.0', false);
      }, /README file not found/);
    });

    test('should read, update and write file', () => {
      const tempPath = path.resolve(__dirname, '..', 'scratch_readme_test.md');
      const initial = `# Header\n<!-- DOWNLOAD_SECTION_START -->\nold\n<!-- DOWNLOAD_SECTION_END -->\n# Footer`;
      fs.writeFileSync(tempPath, initial, 'utf8');
      try {
        const res = updateReadmeFile(tempPath, 'v1.0.0-beta.7', true);
        assert.ok(res.includes('v1.0.0-beta.7'));
        const fileContent = fs.readFileSync(tempPath, 'utf8');
        assert.ok(fileContent.includes('v1.0.0-beta.7'));
      } finally {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      }
    });
  });
});
