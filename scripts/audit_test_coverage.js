#!/usr/bin/env node

/**
 * Race Coordinator AI - Test Coverage & 1:1 Architecture Audit Tool
 *
 * Inspects both Server (Java) and Client (Angular/TypeScript) to report:
 * 1. 1:1 Source <-> Unit Test file mapping
 * 2. Untested source files
 * 3. Orphaned / Fragmented test files
 * 4. UI Component Screendiff & Test Harness coverage
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SERVER_MAIN_DIR = path.join(PROJECT_ROOT, 'server', 'src', 'main', 'java');
const SERVER_TEST_DIR = path.join(PROJECT_ROOT, 'server', 'src', 'test', 'java');
const CLIENT_APP_DIR = path.join(PROJECT_ROOT, 'client', 'src', 'app');

const args = process.argv.slice(2);
const VERBOSE = args.includes('--verbose') || args.includes('-v');
const CI_MODE = args.includes('--ci') || args.includes('--check');

// Color helpers for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function walkDir(dir, filterFn, baseDir = dir) {
  if (!fs.existsSync(dir)) return [];
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.endsWith('-snapshots') || entry.name.startsWith('.')) continue;
      files = files.concat(walkDir(fullPath, filterFn, baseDir));
    } else if (entry.isFile() && (!filterFn || filterFn(entry.name, fullPath))) {
      files.push({
        fullPath,
        relPath: path.relative(baseDir, fullPath),
        name: entry.name,
      });
    }
  }
  return files;
}

// -----------------------------------------------------------------------------
// 1. Server Audit (Java)
// -----------------------------------------------------------------------------
function auditServer() {
  const sourceFiles = walkDir(
    SERVER_MAIN_DIR,
    (name, full) => name.endsWith('.java') && !full.includes('/proto/')
  );

  const testFiles = walkDir(
    SERVER_TEST_DIR,
    (name) => name.endsWith('Test.java')
  );

  const testFileMap = new Map();
  testFiles.forEach(f => testFileMap.set(f.relPath, f));

  const matched = [];
  const missingTests = [];
  const matchedTestRelPaths = new Set();
  let concreteClassesCount = 0;
  let concreteClassesTested = 0;
  const missingConcreteClasses = [];

  for (const src of sourceFiles) {
    const expectedTestRelPath = src.relPath.replace(/\.java$/, 'Test.java');
    const content = fs.readFileSync(src.fullPath, 'utf8');
    const isInterface = /\bpublic\s+interface\b/.test(content);
    const isEnum = /\bpublic\s+enum\b/.test(content);
    const isConcreteClass = !isInterface && !isEnum;

    if (isConcreteClass) {
      concreteClassesCount++;
    }

    if (testFileMap.has(expectedTestRelPath)) {
      matched.push({ source: src, test: testFileMap.get(expectedTestRelPath) });
      matchedTestRelPaths.add(expectedTestRelPath);
      if (isConcreteClass) {
        concreteClassesTested++;
      }
    } else {
      missingTests.push(src);
      if (isConcreteClass) {
        missingConcreteClasses.push(src);
      }
    }
  }

  // Find orphaned or scenario test files that don't match standard Foo.java -> FooTest.java
  const orphanedOrScenarioTests = testFiles.filter(
    t => !matchedTestRelPaths.has(t.relPath)
  );

  return {
    totalSources: sourceFiles.length,
    totalTests: testFiles.length,
    concreteClassesCount,
    concreteClassesTested,
    missingConcreteClasses,
    matched,
    missingTests,
    orphanedOrScenarioTests,
  };
}

// -----------------------------------------------------------------------------
// 2. Client Audit (Angular / TypeScript)
// -----------------------------------------------------------------------------
function auditClient() {
  const allTsFiles = walkDir(
    CLIENT_APP_DIR,
    (name, full) => name.endsWith('.ts') && !full.includes('/proto/') && !name.endsWith('.d.ts')
  );

  const unitSpecs = new Set();
  const screendiffs = new Set();
  const harnesses = new Set();

  allTsFiles.forEach(f => {
    if (f.name.endsWith('.spec.ts')) {
      unitSpecs.add(f.relPath);
    } else if (f.name.endsWith('_screendiff_test.ts')) {
      screendiffs.add(f.relPath);
    } else if (f.name.endsWith('.harness.ts') || f.name.endsWith('.harness.base.ts') || f.name.endsWith('.harness.e2e.ts')) {
      harnesses.add(f.relPath);
    }
  });

  // Categorize source files
  const components = [];
  const services = [];
  const converters = [];
  const utilsAndOther = [];

  allTsFiles.forEach(f => {
    if (f.name.endsWith('.spec.ts') || f.name.endsWith('_screendiff_test.ts') || f.name.includes('.harness.')) {
      return;
    }
    if (f.name.endsWith('.component.ts')) {
      components.push(f);
    } else if (f.name.endsWith('.service.ts')) {
      services.push(f);
    } else if (f.name.endsWith('.converter.ts')) {
      converters.push(f);
    } else {
      utilsAndOther.push(f);
    }
  });

  // Evaluate Component coverage (Unit spec + Screendiff + Harness)
  const componentReport = components.map(c => {
    const specRelPath = c.relPath.replace(/\.ts$/, '.spec.ts');
    const compDir = path.dirname(c.relPath);
    const compBaseName = c.name.replace(/\.component\.ts$/, '');
    
    const hasSpec = unitSpecs.has(specRelPath);
    
    // Screendiff test can be in same dir as <comp>_screendiff_test.ts or in parent
    const directScreendiff = path.join(compDir, `${compBaseName}_screendiff_test.ts`);
    const compScreendiff = path.join(compDir, `${compBaseName}.component_screendiff_test.ts`);
    const hasScreendiff = screendiffs.has(directScreendiff) || screendiffs.has(compScreendiff);

    // Harness can be testing/<compBaseName>.harness.ts
    const harnessRelPath = path.join(compDir, 'testing', `${compBaseName}.harness.ts`);
    const hasHarness = harnesses.has(harnessRelPath);

    return {
      component: c,
      hasSpec,
      hasScreendiff,
      hasHarness,
    };
  });

  // Evaluate Non-Component unit test coverage
  function checkUnitSpecs(list) {
    return list.map(item => {
      const specRelPath = item.relPath.replace(/\.ts$/, '.spec.ts');
      const hasSpec = unitSpecs.has(specRelPath);
      return { item, hasSpec };
    });
  }

  const serviceReport = checkUnitSpecs(services);
  const converterReport = checkUnitSpecs(converters);
  const utilsReport = checkUnitSpecs(utilsAndOther);

  return {
    components: componentReport,
    services: serviceReport,
    converters: converterReport,
    utils: utilsReport,
    totalSpecs: unitSpecs.size,
    totalScreendiffs: screendiffs.size,
  };
}

// -----------------------------------------------------------------------------
// 3. Reporting & CLI Output
// -----------------------------------------------------------------------------
function printScore(label, count, total) {
  const pct = total === 0 ? 100 : Math.round((count / total) * 100);
  const color = pct >= 80 ? colors.green : pct >= 50 ? colors.yellow : colors.red;
  console.log(`  ${label.padEnd(35)}: ${color}${count}/${total} (${pct}%)${colors.reset}`);
}

function run() {
  console.log(`\n${colors.bold}${colors.cyan}======================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}   Race Coordinator AI - Test Architecture & Coverage Audit   ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================${colors.reset}\n`);

  const server = auditServer();
  const client = auditClient();

  console.log(`${colors.bold}🔹 SERVER (Java 1:1 Test Architecture)${colors.reset}`);
  printScore('1:1 Concrete Classes Tested', server.concreteClassesTested, server.concreteClassesCount);
  printScore('Total Matched Source Files', server.matched.length, server.totalSources);
  console.log(`  ${'Total Java Unit Test Files'.padEnd(35)}: ${server.totalTests}`);
  console.log(`  ${'Scenario / Fragmented Test Files'.padEnd(35)}: ${colors.yellow}${server.orphanedOrScenarioTests.length}${colors.reset}`);
  console.log(`  ${'Missing Concrete Class Tests'.padEnd(35)}: ${server.missingConcreteClasses.length === 0 ? colors.green + '0' : colors.yellow + server.missingConcreteClasses.length}${colors.reset}\n`);

  if (VERBOSE && server.missingConcreteClasses.length > 0) {
    console.log(`${colors.yellow}  Untested Concrete Server Classes:${colors.reset}`);
    server.missingConcreteClasses.forEach(s => console.log(`    - ${s.relPath}`));
    console.log('');
  }

  if (VERBOSE && server.orphanedOrScenarioTests.length > 0) {
    console.log(`${colors.yellow}  Fragmented / Scenario Test Files (candidates for consolidation):${colors.reset}`);
    server.orphanedOrScenarioTests.slice(0, 15).forEach(t => console.log(`    - ${t.relPath}`));
    if (server.orphanedOrScenarioTests.length > 15) console.log(`    ... and ${server.orphanedOrScenarioTests.length - 15} more`);
    console.log('');
  }

  const compWithSpec = client.components.filter(c => c.hasSpec).length;
  const compWithScreendiff = client.components.filter(c => c.hasScreendiff).length;
  const compWithHarness = client.components.filter(c => c.hasHarness).length;
  const servicesWithSpec = client.services.filter(s => s.hasSpec).length;
  const convertersWithSpec = client.converters.filter(c => c.hasSpec).length;

  console.log(`${colors.bold}🔹 CLIENT (Angular Unit & Screendiff Coverage)${colors.reset}`);
  printScore('UI Components with Unit Specs', compWithSpec, client.components.length);
  printScore('UI Components with Screendiffs', compWithScreendiff, client.components.length);
  printScore('UI Components with Test Harnesses', compWithHarness, client.components.length);
  printScore('Services with Unit Specs', servicesWithSpec, client.services.length);
  printScore('Converters with Unit Specs', convertersWithSpec, client.converters.length);
  console.log('');

  if (VERBOSE) {
    const missingScreendiff = client.components.filter(c => !c.hasScreendiff);
    if (missingScreendiff.length > 0) {
      console.log(`${colors.yellow}  Components Missing Screendiff Tests:${colors.reset}`);
      missingScreendiff.slice(0, 15).forEach(c => console.log(`    - ${c.component.relPath}`));
      if (missingScreendiff.length > 15) console.log(`    ... and ${missingScreendiff.length - 15} more`);
      console.log('');
    }
  }

  console.log(`${colors.gray}Run with --verbose to view individual file paths.${colors.reset}\n`);

  if (CI_MODE) {
    let failed = false;
    if (server.orphanedOrScenarioTests.length > 0) {
      console.log(
        `${colors.red}❌ Audit check failed: Found ${server.orphanedOrScenarioTests.length} fragmented/orphaned test file(s). All server tests must strictly follow 1:1 class architecture.${colors.reset}`
      );
      server.orphanedOrScenarioTests.forEach(t => console.log(`   - ${t.relPath}`));
      failed = true;
    }

    if (server.missingConcreteClasses.length > 0) {
      console.log(
        `${colors.red}❌ Audit check failed: Server concrete class test coverage regressed (${server.missingConcreteClasses.length} untested concrete classes, baseline max allowed: 0).${colors.reset}`
      );
      server.missingConcreteClasses.forEach(s => console.log(`   - ${s.relPath}`));
      failed = true;
    }

    if (compWithSpec < 100) {
      console.log(
        `${colors.red}❌ Audit check failed: Client component unit test coverage regressed (${compWithSpec}/100 components tested).${colors.reset}`
      );
      failed = true;
    }

    if (compWithHarness < 100) {
      console.log(
        `${colors.red}❌ Audit check failed: Client component test harness coverage regressed (${compWithHarness}/100 components with harnesses).${colors.reset}`
      );
      failed = true;
    }

    if (servicesWithSpec < 22) {
      console.log(
        `${colors.red}❌ Audit check failed: Client service unit test coverage regressed (${servicesWithSpec}/22 services tested).${colors.reset}`
      );
      failed = true;
    }

    if (convertersWithSpec < 13) {
      console.log(
        `${colors.red}❌ Audit check failed: Client converter unit test coverage regressed (${convertersWithSpec}/13 converters tested).${colors.reset}`
      );
      failed = true;
    }

    if (failed) {
      console.log(`\n${colors.red}Audit gate failed. Please resolve the issues above.${colors.reset}\n`);
      process.exit(1);
    } else {
      console.log(`${colors.green}✅ All architecture & test coverage baseline gates passed!${colors.reset}\n`);
    }
  }
}

run();
