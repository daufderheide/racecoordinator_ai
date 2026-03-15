import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';
import { ArduinoEditorHarnessE2e } from './testing/arduino-editor.harness.e2e';

test.describe('Arduino Editor Component Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display editor with pin grid and assignments', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));

    const editor = page.locator('app-arduino-editor');
    const harness = new ArduinoEditorHarnessE2e(editor);

    await expect(editor).toBeVisible();

    // Wait for board image to be loaded to avoid blank white sections
    await expect(editor.locator('.board-image')).toBeVisible();

    // Check board type dropdown
    expect(await harness.getBoardType()).toBe('1'); // Mega

    // Take snapshot of the editor area
    await expect(page).toHaveScreenshot('arduino-editor-component.png');
  });

  test('should display reserved and unused pins correctly', async ({ page }) => {
    await page.route('**/api/tracks', async (route) => {
      const tracks = [
        {
          entity_id: 't-mix',
          name: 'Mixed Pins',
          lanes: [{ entity_id: 'l1', length: 10, backgroundColor: '#fff', foregroundColor: '#000' }],
          arduino_configs: [{
            name: 'Arduino Mix',
            commPort: 'COM1',
            baudRate: 115200,
            debounceUs: 5000,
            hardwareType: 0, // Uno
            digitalIds: [0, 1, 2, 3], // Unused, Reserved, Call Button (Master), Relay (Master)
            analogIds: [-1, -1, -1, -1],
            normallyClosedLaneSensors: false,
            normallyClosedRelays: true,
            globalInvertLights: 0,
            useLapsForPits: 0,
            useLapsForPitEnd: 0,
            usePitsAsLaps: false,
            useLapsForSegments: true,
            ledStrings: null,
            ledLaneColorOverrides: null,
            lapPinPitBehavior: 3
          }]
        }
      ];

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(tracks),
      });
    });

    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t-mix'));

    const editor = page.locator('app-arduino-editor');
    const harness = new ArduinoEditorHarnessE2e(editor);

    await expect(editor).toBeVisible();

    // Check actions
    // digitalIds: [0, 1, 2, 3]
    // index 0 -> Pin 2
    // index 1 -> Pin 3
    // index 2 -> Pin 4
    // index 3 -> Pin 5
    expect(await harness.getSelectedPinAction(true, 2)).toBe('Call Button');
    expect(await harness.getSelectedPinAction(true, 3)).toBe('Relay');
    expect(await harness.getSelectedPinAction(true, 4)).toBe('Unused');
    expect(await harness.getSelectedPinAction(true, 5)).toBe('Unused');

    await expect(page).toHaveScreenshot('arduino-editor-mixed-pins.png');
  });
});

const VOLTAGE_BASE = 7000;

test.describe('Arduino Editor Voltage Divider Config Visuals', () => {
  const voltageTrack = {
    entity_id: 't-voltage',
    name: 'Voltage Track',
    lanes: [
      { entity_id: 'l1', length: 12.5, backgroundColor: '#ff0000', foregroundColor: '#ffffff' },
      { entity_id: 'l2', length: 12.5, backgroundColor: '#0000ff', foregroundColor: '#ffffff' },
      { entity_id: 'l3', length: 12.5, backgroundColor: '#00ff00', foregroundColor: '#ffffff' },
    ],
    arduino_configs: [{
      name: 'Voltage Arduino',
      commPort: 'COM5',
      baudRate: 115200,
      debounceUs: 5000,
      hardwareType: 0,
      digitalIds: [-1, -1, -1, -1],
      analogIds: [
        VOLTAGE_BASE,
        VOLTAGE_BASE + 1,
        VOLTAGE_BASE + 2,
        -1, -1, -1
      ],
      normallyClosedLaneSensors: false,
      normallyClosedRelays: true,
      globalInvertLights: 0,
      useLapsForPits: 0,
      useLapsForPitEnd: 0,
      usePitsAsLaps: false,
      useLapsForSegments: true,
      ledStrings: null,
      ledLaneColorOverrides: null,
      lapPinPitBehavior: 3,
      voltageConfigs: { 0: 900, 1: 1023, 2: 1023 }
    }]
  };

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);

    await page.route('**/api/tracks', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([voltageTrack]),
      });
    });
  });

  test('should display voltage divider configuration section with lanes independent', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t-voltage'));

    const editor = page.locator('app-arduino-editor');
    const harness = new ArduinoEditorHarnessE2e(editor);

    await expect(editor).toBeVisible();

    if (!(await harness.isSectionExpanded('voltage'))) {
      await harness.toggleSection('voltage');
    }

    expect(await harness.isVoltageLinked(0)).toBe(false);

    await expect(editor.locator('.voltage-config-section')).toHaveScreenshot('voltage-config-lanes-independent.png');
  });

  test('should display linked state for all voltage lanes', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t-voltage'));

    const editor = page.locator('app-arduino-editor');
    const harness = new ArduinoEditorHarnessE2e(editor);

    await expect(editor).toBeVisible();

    if (!(await harness.isSectionExpanded('voltage'))) {
      await harness.toggleSection('voltage');
    }

    await harness.clickVoltageLink(0);
    expect(await harness.isVoltageLinked(0)).toBe(true);

    await expect(editor.locator('.voltage-config-section')).toHaveScreenshot('voltage-config-lanes-linked.png');
  });
});

test.describe('Arduino Editor Section Expander States', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  async function waitForBoardImage(page: any, root: any) {
    const boardImg = root.locator('.board-image');
    if (await boardImg.count() > 0) {
      await boardImg.evaluate((img: any) => {
        return new Promise((resolve) => {
          const check = () => {
            if ((img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0) {
              resolve(true);
            } else {
              setTimeout(check, 50);
            }
          };
          img.onload = check;
          img.onerror = () => resolve(false);
          check();
        });
      });
    }
  }

  async function openEditor(page: any) {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));
    const editor = page.locator('app-arduino-editor');
    await expect(editor).toBeVisible();
    await waitForBoardImage(page, editor);
    return editor;
  }

  test('should show all sections expanded by default', async ({ page }) => {
    const editor = await openEditor(page);
    const harness = new ArduinoEditorHarnessE2e(editor);

    expect(await harness.isSectionExpanded('main')).toBe(true);
    expect(await harness.isSectionExpanded('digital')).toBe(true);
    expect(await harness.isSectionExpanded('analog')).toBe(true);

    await expect(editor).toHaveScreenshot('arduino-editor-all-expanded.png');
  });

  test('should collapse main section when header is clicked', async ({ page }) => {
    const editor = await openEditor(page);
    const harness = new ArduinoEditorHarnessE2e(editor);

    await harness.toggleSection('main');
    await page.waitForTimeout(300);
    expect(await harness.isSectionExpanded('main')).toBe(false);

    await expect(editor).toHaveScreenshot('arduino-editor-main-collapsed.png');
  });

  test('should collapse digital pins section when header is clicked', async ({ page }) => {
    const editor = await openEditor(page);
    const harness = new ArduinoEditorHarnessE2e(editor);

    await harness.toggleSection('digital');
    await page.waitForTimeout(300);
    expect(await harness.isSectionExpanded('digital')).toBe(false);

    await expect(editor).toHaveScreenshot('arduino-editor-digital-collapsed.png');
  });

  test('should collapse analog pins section when header is clicked', async ({ page }) => {
    const editor = await openEditor(page);
    const harness = new ArduinoEditorHarnessE2e(editor);

    await harness.toggleSection('analog');
    await page.waitForTimeout(300);
    expect(await harness.isSectionExpanded('analog')).toBe(false);

    await expect(editor).toHaveScreenshot('arduino-editor-analog-collapsed.png');
  });
});

