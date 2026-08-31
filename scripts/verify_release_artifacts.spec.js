const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { verifyReleaseArtifacts, parseCliArgs, resolveArg } = require('./verify_release_artifacts');

describe('verify_release_artifacts', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rc_verify_test_'));
  });

  afterEach(() => {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('should fail if expected version is not provided or empty', () => {
    const result = verifyReleaseArtifacts({});
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors.length > 0);
    assert.ok(result.errors[0].includes('Expected release version must be provided'));
  });

  test('should fail if expected version is 0.0.0_dev', () => {
    const result = verifyReleaseArtifacts({ version: '0.0.0_dev' });
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors[0].includes('Release version cannot be "0.0.0_dev"'));
  });

  test('should fail if web directory does not exist', () => {
    const nonExistent = path.join(tmpDir, 'web_missing');
    const result = verifyReleaseArtifacts({ version: '1.0.0', webDir: nonExistent });
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors[0].includes('Web client directory not found'));
  });

  test('should fail if web directory has no js files', () => {
    const emptyWeb = path.join(tmpDir, 'web_empty');
    fs.mkdirSync(emptyWeb);
    const result = verifyReleaseArtifacts({ version: '1.0.0', webDir: emptyWeb });
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors[0].includes('No JavaScript bundle files found'));
  });

  test('should fail if expected version is missing from production web bundle', () => {
    const webDir = path.join(tmpDir, 'web');
    fs.mkdirSync(webDir);
    fs.writeFileSync(path.join(webDir, 'main.1234.js'), 'console.log("some unstamped bundle");');

    const result = verifyReleaseArtifacts({ version: '1.0.0', webDir });
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors[0].includes('Expected release version "1.0.0" was not found'));
  });

  test('should succeed when production web bundle contains expected release version', () => {
    const webDir = path.join(tmpDir, 'web');
    fs.mkdirSync(webDir);
    fs.writeFileSync(path.join(webDir, 'main.1234.js'), 'console.log("CLIENT_VERSION_BUILD: 1.0.0");');

    const result = verifyReleaseArtifacts({ version: '1.0.0', webDir });
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  test('should validate installer_base.iss and detect 0.0.0_dev or mismatch', () => {
    const issFile = path.join(tmpDir, 'installer_base.iss');
    fs.writeFileSync(issFile, '#define MyAppVersion "0.0.0_dev"\n');

    let result = verifyReleaseArtifacts({ version: '1.0.0', installerFile: issFile });
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors[0].includes('installer_base.iss MyAppVersion is still "0.0.0_dev"'));

    fs.writeFileSync(issFile, '#define MyAppVersion "0.9.0"\n');
    result = verifyReleaseArtifacts({ version: '1.0.0', installerFile: issFile });
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors[0].includes('does not match expected version'));

    fs.writeFileSync(issFile, '#define MyAppVersion "1.0.0"\n');
    result = verifyReleaseArtifacts({ version: '1.0.0', installerFile: issFile });
    assert.strictEqual(result.isValid, true);
  });

  test('should skip installer_base.iss validation when installerFile is empty or not provided', () => {
    const appFile = path.join(tmpDir, 'App.java');
    fs.writeFileSync(appFile, 'public static final String SERVER_VERSION = "1.0.0";\n');

    const result = verifyReleaseArtifacts({
      version: '1.0.0',
      serverFile: appFile,
      installerFile: ''
    });
    assert.strictEqual(result.isValid, true);
    assert.strictEqual(result.errors.length, 0);
  });

  test('should validate App.java and detect 0.0.0_dev or mismatch', () => {
    const appFile = path.join(tmpDir, 'App.java');
    fs.writeFileSync(appFile, 'public static final String SERVER_VERSION = "0.0.0_dev";\n');

    let result = verifyReleaseArtifacts({ version: '1.0.0', serverFile: appFile });
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors[0].includes('App.java SERVER_VERSION is still "0.0.0_dev"'));

    fs.writeFileSync(appFile, 'public static final String SERVER_VERSION = "1.0.0";\n');
    result = verifyReleaseArtifacts({ version: '1.0.0', serverFile: appFile });
    assert.strictEqual(result.isValid, true);
  });

  test('should validate version.ts and detect 0.0.0_dev or mismatch', () => {
    const versionTsFile = path.join(tmpDir, 'version.ts');
    fs.writeFileSync(versionTsFile, 'export const CLIENT_VERSION_BUILD: string = "0.0.0_dev";\n');

    let result = verifyReleaseArtifacts({ version: '1.0.0', versionFile: versionTsFile });
    assert.strictEqual(result.isValid, false);
    assert.ok(result.errors[0].includes('version.ts CLIENT_VERSION_BUILD is still "0.0.0_dev"'));

    fs.writeFileSync(versionTsFile, 'export const CLIENT_VERSION_BUILD: string = "1.0.0";\n');
    result = verifyReleaseArtifacts({ version: '1.0.0', versionFile: versionTsFile });
    assert.strictEqual(result.isValid, true);
  });

  describe('resolveArg and parseCliArgs', () => {
    test('resolveArg should return defaultVal when undefined', () => {
      assert.strictEqual(resolveArg(undefined, 'default'), 'default');
    });

    test('resolveArg should return empty string for empty or sentinel strings', () => {
      assert.strictEqual(resolveArg('', 'default'), '');
      assert.strictEqual(resolveArg('""', 'default'), '');
      assert.strictEqual(resolveArg("''", 'default'), '');
      assert.strictEqual(resolveArg('none', 'default'), '');
      assert.strictEqual(resolveArg('null', 'default'), '');
      assert.strictEqual(resolveArg('-', 'default'), '');
      assert.strictEqual(resolveArg('   ', 'default'), '');
    });

    test('resolveArg should return trimmed value when non-empty', () => {
      assert.strictEqual(resolveArg('  some/path  ', 'default'), 'some/path');
    });

    test('parseCliArgs should use defaults when only version is passed', () => {
      const argv = ['node', 'verify.js', '1.0.0-beta.1'];
      const args = parseCliArgs(argv, {});
      assert.strictEqual(args.version, '1.0.0-beta.1');
      assert.strictEqual(args.serverFile, 'server/src/main/java/com/antigravity/App.java');
      assert.strictEqual(args.installerFile, 'installer_base.iss');
      assert.strictEqual(args.versionFile, 'client/src/app/version.ts');
    });

    test('parseCliArgs should allow empty string for installerFile (Linux build pattern)', () => {
      const argv = [
        'node',
        'verify.js',
        '1.0.0-beta.41',
        'release/RaceCoordinator_Linux_ARM64/web',
        'server/src/main/java/com/antigravity/App.java',
        '',
        'client/src/app/version.ts'
      ];
      const args = parseCliArgs(argv, {});
      assert.strictEqual(args.version, '1.0.0-beta.41');
      assert.strictEqual(args.webDir, 'release/RaceCoordinator_Linux_ARM64/web');
      assert.strictEqual(args.serverFile, 'server/src/main/java/com/antigravity/App.java');
      assert.strictEqual(args.installerFile, '');
      assert.strictEqual(args.versionFile, 'client/src/app/version.ts');
    });
  });
});
