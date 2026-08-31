const fs = require('fs');
const path = require('path');

/**
 * Validates that production artifacts do not contain development fallback version ("0.0.0_dev")
 * and properly reflect the release version.
 *
 * @param {Object} options
 * @param {string} options.version Expected release version (e.g. "1.0.0-alpha.20260830")
 * @param {string} [options.webDir] Directory containing web client build artifacts
 * @param {string} [options.serverFile] Path to App.java or server source
 * @param {string} [options.installerFile] Path to installer_base.iss
 * @param {string} [options.versionFile] Path to version.ts
 * @returns {{ isValid: boolean, errors: string[] }}
 */
function verifyReleaseArtifacts(options = {}) {
  const errors = [];
  const expectedVersion = options.version ? String(options.version).trim() : null;

  if (!expectedVersion) {
    errors.push('Expected release version must be provided for verification.');
    return { isValid: false, errors };
  }

  if (expectedVersion === '0.0.0_dev' || expectedVersion.startsWith('0.0.0_dev')) {
    errors.push(`Release version cannot be "0.0.0_dev": "${expectedVersion}"`);
  }

  // 1. Verify Web Client JS Bundles contain expected release version
  if (options.webDir) {
    const webDirPath = path.resolve(options.webDir);
    if (!fs.existsSync(webDirPath)) {
      errors.push(`Web client directory not found: ${webDirPath}`);
    } else {
      const jsFiles = [];
      function collectJsFiles(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            collectJsFiles(full);
          } else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.includes('.spec.')) {
            jsFiles.push(full);
          }
        }
      }
      collectJsFiles(webDirPath);

      if (jsFiles.length === 0) {
        errors.push(`No JavaScript bundle files found in: ${webDirPath}`);
      } else {
        let versionFoundInBundle = false;
        for (const jsFile of jsFiles) {
          const content = fs.readFileSync(jsFile, 'utf8');
          if (expectedVersion && content.includes(expectedVersion)) {
            versionFoundInBundle = true;
            break;
          }
        }
        if (expectedVersion && !versionFoundInBundle) {
          errors.push(
            `Expected release version "${expectedVersion}" was not found in any web client JavaScript bundle in: ${path.relative(process.cwd(), webDirPath)}`
          );
        }
      }
    }
  }

  // 2. Verify installer_base.iss if provided
  if (options.installerFile) {
    const issPath = path.resolve(options.installerFile);
    if (fs.existsSync(issPath)) {
      const content = fs.readFileSync(issPath, 'utf8');
      const match = content.match(/#define\s+MyAppVersion\s+"([^"]+)"/);
      if (match) {
        const foundVersion = match[1];
        if (foundVersion === '0.0.0_dev') {
          errors.push(`installer_base.iss MyAppVersion is still "0.0.0_dev"!`);
        } else if (expectedVersion && foundVersion !== expectedVersion) {
          errors.push(
            `installer_base.iss MyAppVersion "${foundVersion}" does not match expected version "${expectedVersion}"!`
          );
        }
      } else {
        errors.push(`Could not find MyAppVersion definition in ${issPath}`);
      }
    }
  }

  // 3. Verify App.java if provided
  if (options.serverFile) {
    const appPath = path.resolve(options.serverFile);
    if (fs.existsSync(appPath)) {
      const content = fs.readFileSync(appPath, 'utf8');
      const match = content.match(/SERVER_VERSION\s*=\s*"([^"]+)";/);
      if (match) {
        const foundVersion = match[1];
        if (foundVersion === '0.0.0_dev') {
          errors.push(`App.java SERVER_VERSION is still "0.0.0_dev"!`);
        } else if (expectedVersion && foundVersion !== expectedVersion) {
          errors.push(
            `App.java SERVER_VERSION "${foundVersion}" does not match expected version "${expectedVersion}"!`
          );
        }
      } else {
        errors.push(`Could not find SERVER_VERSION in ${appPath}`);
      }
    }
  }

  // 4. Verify version.ts if provided
  if (options.versionFile) {
    const versionTsPath = path.resolve(options.versionFile);
    if (fs.existsSync(versionTsPath)) {
      const content = fs.readFileSync(versionTsPath, 'utf8');
      const match = content.match(/CLIENT_VERSION_BUILD\s*(?::\s*string)?\s*=\s*"([^"]+)";/);
      if (match) {
        const foundVersion = match[1];
        if (foundVersion === '0.0.0_dev') {
          errors.push(`version.ts CLIENT_VERSION_BUILD is still "0.0.0_dev"!`);
        } else if (expectedVersion && foundVersion !== expectedVersion) {
          errors.push(
            `version.ts CLIENT_VERSION_BUILD "${foundVersion}" does not match expected version "${expectedVersion}"!`
          );
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function resolveArg(val, defaultVal = '') {
  if (val === undefined) {
    return defaultVal;
  }
  const str = String(val).trim();
  if (str === '' || str === '""' || str === "''" || str === 'none' || str === 'null' || str === '-') {
    return '';
  }
  return str;
}

function parseCliArgs(argv = process.argv, env = process.env) {
  const versionArg = argv[2] || env.VERSION || '';
  const defaultWebDir = fs.existsSync('release/RaceCoordinator/web')
    ? 'release/RaceCoordinator/web'
    : (fs.existsSync('client/dist/client') ? 'client/dist/client' : '');
  const webDirArg = resolveArg(argv[3], defaultWebDir);
  const serverFileArg = resolveArg(argv[4], 'server/src/main/java/com/antigravity/App.java');
  const installerFileArg = resolveArg(argv[5], 'installer_base.iss');
  const versionFileArg = resolveArg(argv[6], 'client/src/app/version.ts');

  return {
    version: versionArg,
    webDir: webDirArg,
    serverFile: serverFileArg,
    installerFile: installerFileArg,
    versionFile: versionFileArg
  };
}

function main() {
  const args = parseCliArgs(process.argv, process.env);

  if (!args.version) {
    console.error('❌ Error: Expected version must be provided.');
    console.error('Usage: node verify_release_artifacts.js <version> [webDir] [serverFile] [installerFile] [versionFile]');
    process.exit(1);
  }

  console.log(`🔍 Verifying Release Artifacts for Version: "${args.version}"...`);
  console.log(`   Web Directory:       ${args.webDir || '(none)'}`);
  console.log(`   Server App File:     ${args.serverFile || '(none)'}`);
  console.log(`   Installer File:      ${args.installerFile || '(none)'}`);
  console.log(`   Client Version File: ${args.versionFile || '(none)'}`);

  const result = verifyReleaseArtifacts(args);

  if (!result.isValid) {
    console.error('\n❌ [Release Artifacts Verification FAILED]');
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
    console.error('\nBuild aborted to prevent publishing broken or unversioned artifacts.\n');
    process.exit(1);
  }

  console.log('\n✅ All release artifacts verified successfully. Versioning integrity confirmed!\n');
}

if (require.main === module) {
  main();
}

module.exports = {
  verifyReleaseArtifacts,
  parseCliArgs,
  resolveArg
};
