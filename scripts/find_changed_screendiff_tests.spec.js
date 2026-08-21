const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { resolveTestsForFile } = require('./find_changed_screendiff_tests');

describe('find_changed_screendiff_tests', () => {
  test('should ignore i18n translation json files', () => {
    const enRes = resolveTestsForFile('client/src/assets/i18n/en.json');
    assert.deepStrictEqual(enRes, []);

    const deRes = resolveTestsForFile('client/src/assets/i18n/de.json');
    assert.deepStrictEqual(deRes, []);

    const esRes = resolveTestsForFile('client/src/assets/i18n/es.json');
    assert.deepStrictEqual(esRes, []);
  });

  test('should trigger all visual tests on global style or app component changes', () => {
    const stylesRes = resolveTestsForFile('client/src/styles.scss');
    assert.ok(stylesRes.length > 0);

    const appHtmlRes = resolveTestsForFile('client/src/app/app.component.html');
    assert.ok(appHtmlRes.length > 0);
  });

  test('should trigger component screendiff tests on component changes', () => {
    const componentRes = resolveTestsForFile('client/src/app/components/raceday-setup/default-raceday-setup.component.ts');
    assert.ok(componentRes.length > 0);
    const hasRacedayTest = componentRes.some(t => t.includes('raceday-setup_screendiff_test.ts'));
    assert.ok(hasRacedayTest);
  });

  test('should return direct screendiff test if screendiff test file changed', () => {
    const directRes = resolveTestsForFile('client/src/app/components/raceday-setup/raceday-setup_screendiff_test.ts');
    assert.strictEqual(directRes.length, 1);
    assert.ok(directRes[0].endsWith('raceday-setup_screendiff_test.ts'));
  });
});
