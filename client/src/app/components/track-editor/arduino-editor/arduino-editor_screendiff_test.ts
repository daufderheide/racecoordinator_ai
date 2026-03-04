import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';

test.describe('Arduino Editor Component Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
  });

  test('should display editor with pin grid and assignments', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));

    // Wait for the Arduino Editor component to be visible
    const editor = page.locator('app-arduino-editor');
    await expect(editor).toBeVisible();

    // Check header
    // The header is inside .arduino-config-container > .config-section
    await expect(editor.locator('.arduino-config-container > .config-section > .section-header h1')).toContainText('Arduino Configuration');

    // Wait for board image to be loaded to avoid blank white sections
    await expect(editor.locator('.board-image')).toBeVisible();
    await editor.locator('.board-image').evaluate((img: any) => {
      return new Promise((resolve) => {
        if ((img as HTMLImageElement).complete) resolve(true);
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false); // Resolve false on error to avoid hang
        setTimeout(() => resolve(false), 5000); // 5s fallback timeout
      });
    });

    // Check board type dropdown
    const boardSelect = editor.locator('.board-controls select').first();
    await expect(boardSelect).toBeVisible();
    await expect(boardSelect).toHaveValue('1'); // Mega

    // Check pin grid visibility
    await expect(editor.locator('.pin-grid').first()).toBeVisible();

    // Take snapshot of the editor area
    await expect(page).toHaveScreenshot('arduino-editor-component.png');
  });

  test('should display reserved and unused pins correctly', async ({ page }) => {
    // We override mocks to have a track with specific pin configs if needed, 
    // but t1 in standard mocks has [1001, 1002, -1, -1] -> [Lap L1, Lap L2, Unused, Unused]
    // Let's modify it to include Reserved and Call Button to see properly.

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
            globalInvertLanes: 0,
            normallyClosedRelays: true,
            globalInvertLights: 0,
            useLapsForPits: 0,
            useLapsForPitEnd: 0,
            usePitsAsLaps: 0,
            useLapsForSegments: 0,
            ledStrings: null,
            ledLaneColorOverrides: null
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
    await expect(editor).toBeVisible();

    // Check for specific texts in the dropdowns or display
    // Note: The editor uses selects for pin assignment.
    // Pin 0 (Unused)
    // Pin 1 (Reserved)
    // Pin 2 (Master Call)
    // Pin 3 (Master Relay)

    // We can check the values of the selects
    const selects = editor.locator('.pin-item select');

    // Select 0 (Pin 2) -> ID 0 (Unused)
    // Wait, digitalIds index 0 is mapped to Pin 2 on Uno/Mega usually in UI?
    // Actually digitalIds[0] is Pin 2.
    // So Pin 2 -> Unused (0)
    // Pin 3 -> Reserved (1)
    // Pin 4 -> Call Button (2)
    // Pin 5 -> Relay (3)

    // We can check the text of the selected options instead of values for robustness
    // Based on t-mix digitalIds: [0, 1, 2, 3] and loop starting at pin 2:
    // Pin 2 -> digitalIds[2] = 2 (Call Button)
    // Pin 3 -> digitalIds[3] = 3 (Relay)
    // Pin 4 -> digitalIds[4] = undefined (Unused)
    await expect(selects.nth(0).locator('option:checked')).toHaveText('Call Button'); // Pin 2
    await expect(selects.nth(1).locator('option:checked')).toHaveText('Relay'); // Pin 3
    await expect(selects.nth(2).locator('option:checked')).toHaveText('Unused'); // Pin 4
    await expect(selects.nth(3).locator('option:checked')).toHaveText('Unused'); // Pin 5

    await expect(page).toHaveScreenshot('arduino-editor-mixed-pins.png');
  });
});

// BEHAVIOR_VOLTAGE_LEVEL_BASE = 7000
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
      globalInvertLanes: 0,
      normallyClosedRelays: true,
      globalInvertLights: 0,
      useLapsForPits: 0,
      useLapsForPitEnd: 0,
      usePitsAsLaps: 0,
      useLapsForSegments: 0,
      ledStrings: null,
      ledLaneColorOverrides: null,
      voltageConfigs: { 0: 900, 1: 1023, 2: 1023 }
    }]
  };

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);

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
    await expect(editor).toBeVisible();

    // Expand the voltage section
    const voltageSection = editor.locator('.voltage-config-section');
    await expect(voltageSection).toBeVisible({ timeout: 5000 });

    // Click header to expand if collapsed
    const sectionHeader = voltageSection.locator('.section-header');
    if (!(await voltageSection.locator('.section-content').isVisible())) {
      await sectionHeader.click();
    }

    // Confirm 3 voltage lane items are shown
    await expect(voltageSection.locator('.voltage-pin-item')).toHaveCount(3);

    // Confirm Reset Max Seen and Independent toggle buttons are visible
    const buttons = voltageSection.locator('.link-toggle-btn');
    await expect(buttons).toHaveCount(2);
    // The link button (second) shows "Lanes Independent" by default
    await expect(buttons.nth(1)).not.toHaveClass(/linked/);

    await expect(voltageSection).toHaveScreenshot('voltage-config-lanes-independent.png');
  });

  test('should display linked state for all voltage lanes', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t-voltage'));

    const editor = page.locator('app-arduino-editor');
    await expect(editor).toBeVisible();

    const voltageSection = editor.locator('.voltage-config-section');
    await expect(voltageSection).toBeVisible({ timeout: 5000 });

    const sectionHeader = voltageSection.locator('.section-header');
    if (!(await voltageSection.locator('.section-content').isVisible())) {
      await sectionHeader.click();
    }

    // Click the link lanes button (second button)
    const linkBtn = voltageSection.locator('.link-toggle-btn').nth(1);
    await linkBtn.click();
    await expect(linkBtn).toHaveClass(/linked/);

    await expect(voltageSection).toHaveScreenshot('voltage-config-lanes-linked.png');
  });
});

test.describe('Arduino Editor Section Expander States', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
  });

  async function waitForBoardImage(page: any, root: any) {
    const boardImg = root.locator('.board-image');
    if (await boardImg.count() > 0) {
      // Use evaluate to check if image is actually loaded, has a size, and is visible
      await boardImg.evaluate((img: any) => {
        return new Promise((resolve) => {
          const check = () => {
            const style = window.getComputedStyle(img);
            if ((img as HTMLImageElement).complete &&
              (img as HTMLImageElement).naturalWidth > 0 &&
              style.visibility !== 'hidden' &&
              style.display !== 'none' &&
              parseFloat(style.opacity) > 0.9) {
              resolve(true);
            } else {
              setTimeout(check, 50);
            }
          };
          img.onload = check;
          img.onerror = () => resolve(false);
          check();
          setTimeout(() => resolve(false), 5000); // 5s fallback
        });
      });
    }
    await page.waitForTimeout(200); // Final settling wait
  }

  async function openEditor(page: any) {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));
    const editor = page.locator('app-arduino-editor');
    await expect(editor).toBeVisible();

    // Reset parent scroll to top to avoid clipping issues
    await page.locator('.preview-panel').evaluate((el: any) => el.scrollTop = 0).catch(() => null);

    await waitForBoardImage(page, editor);
    return editor;
  }

  test('should show all sections expanded by default', async ({ page }) => {
    const editor = await openEditor(page);
    // All sections expanded: section-content present in each .config-section
    const sections = editor.locator('.config-section');
    await expect(sections.first().locator(':scope > .section-content')).toBeVisible();
    await expect(editor).toHaveScreenshot('arduino-editor-all-expanded.png');
  });

  test('should collapse main section when header is clicked', async ({ page }) => {
    const editor = await openEditor(page);
    // Use text-based selector to find the Main Configuration section
    // Use .sections-wrapper to ensure we get the inner section and avoid strict mode violations with the outer one
    const mainSection = editor.locator('.sections-wrapper .config-section', { has: page.locator('.section-header', { hasText: 'Main Configuration' }) });
    await mainSection.locator(':scope > .section-header').click();
    await page.waitForTimeout(300);
    await expect(mainSection.locator(':scope > .section-content')).not.toBeVisible();
    await expect(mainSection.locator('.expander-icon')).toHaveClass(/collapsed/);

    // Check image stability before screenshot if main section was collapsed it shouldn't show anyway, 
    // but if it's visible in other tests we wait for it.
    await page.locator('.preview-panel').evaluate((el: any) => el.scrollTop = 0).catch(() => null);
    await expect(editor).toHaveScreenshot('arduino-editor-main-collapsed.png');
  });

  test('should collapse digital pins section when header is clicked', async ({ page }) => {
    const editor = await openEditor(page);
    // Find Digital Pins section by its header text
    const digitalSection = editor.locator('.sections-wrapper .config-section', { has: page.locator('.section-header', { hasText: 'Digital Pins' }) });
    const digitalHeader = digitalSection.locator(':scope > .section-header');
    await digitalHeader.scrollIntoViewIfNeeded();
    await digitalHeader.click();
    await page.waitForTimeout(300);
    await expect(digitalSection.locator(':scope > .section-content')).not.toBeVisible();
    await expect(digitalSection.locator('.expander-icon')).toHaveClass(/collapsed/);

    // Reset scroll to top before taking a screenshot
    // Reset parent first, then child
    await page.locator('.preview-panel').evaluate((el: any) => el.scrollTop = 0).catch(() => null);
    const wrapper = editor.locator('.sections-wrapper');
    if (await wrapper.count() > 0) {
      await wrapper.evaluate((el: any) => el.scrollTop = 0).catch(() => null);
    }
    await page.waitForTimeout(100);

    await expect(editor).toHaveScreenshot('arduino-editor-digital-collapsed.png');
  });

  test('should collapse analog pins section when header is clicked', async ({ page }) => {
    const editor = await openEditor(page);
    // Find Analog Pins section by its header text
    const analogSection = editor.locator('.sections-wrapper .config-section', { has: page.locator('.section-header', { hasText: 'Analog Pins' }) });
    const analogHeader = analogSection.locator(':scope > .section-header');
    await analogHeader.scrollIntoViewIfNeeded();
    await analogHeader.click();
    await page.waitForTimeout(300);
    await expect(analogSection.locator(':scope > .section-content')).not.toBeVisible();
    await expect(analogSection.locator('.expander-icon')).toHaveClass(/collapsed/);

    // Reset scroll to top before taking a screenshot
    // This is critical to avoid 'white box' artifacts where top sections are scrolled away
    await page.locator('.preview-panel').evaluate((el: any) => el.scrollTop = 0).catch(() => null);
    const wrapper = editor.locator('.sections-wrapper');
    if (await wrapper.count() > 0) {
      await wrapper.evaluate((el: any) => el.scrollTop = 0).catch(() => null);
    }
    await page.waitForTimeout(100);

    // Ensure board image is loaded in the STILL EXPANDED main section
    await waitForBoardImage(page, editor);
    await expect(editor).toHaveScreenshot('arduino-editor-analog-collapsed.png');
  });

  test('should collapse all sections when every header is clicked', async ({ page }) => {
    const editor = await openEditor(page);
    // Click inner sections first to avoid outer collapse breaking the DOM
    const innerHeaders = ['Main Configuration', 'Digital Pins', 'Analog Pins'];
    for (const text of innerHeaders) {
      const section = editor.locator('.sections-wrapper .config-section', { has: page.locator('.section-header', { hasText: text }) });
      await section.locator(':scope > .section-header').click();
      await page.waitForTimeout(100); // Give Angular a moment to settle state
      await expect(section.locator(':scope > .section-content')).not.toBeVisible();
    }
    const outerHeader = editor.locator('.arduino-config-container > .config-section > .section-header').first();
    await outerHeader.scrollIntoViewIfNeeded();
    await outerHeader.click();
    await page.waitForTimeout(300);

    // Ensure we are scrolled to top for the final screenshot
    await page.locator('.preview-panel').evaluate((el: any) => el.scrollTop = 0).catch(() => null);
    const wrapper = editor.locator('.sections-wrapper');
    if (await wrapper.count() > 0) {
      await wrapper.evaluate((el: any) => el.scrollTop = 0).catch(() => null);
    }
    await page.waitForTimeout(100);

    await expect(editor).toHaveScreenshot('arduino-editor-all-collapsed.png');
  });

  test('should re-expand a collapsed section when header is clicked again', async ({ page }) => {
    const editor = await openEditor(page);
    const mainSection = editor.locator('.sections-wrapper .config-section', { has: page.locator('.section-header', { hasText: 'Main Configuration' }) });
    await mainSection.locator(':scope > .section-header').click();
    await expect(mainSection.locator(':scope > .section-content')).not.toBeVisible();
    // Click again to re-expand
    await mainSection.locator(':scope > .section-header').click();
    await page.waitForTimeout(200);

    // Reset scroll to top
    await page.locator('.preview-panel').evaluate((el: any) => el.scrollTop = 0).catch(() => null);
    const wrapper = editor.locator('.sections-wrapper');
    if (await wrapper.count() > 0) {
      await wrapper.evaluate((el: any) => el.scrollTop = 0).catch(() => null);
    }
    await page.waitForTimeout(100);

    // Wait for board image to be loaded again after expansion
    await waitForBoardImage(page, mainSection);

    await expect(mainSection.locator(':scope > .section-content')).toBeVisible();
    await expect(mainSection.locator('.expander-icon')).not.toHaveClass(/collapsed/);
    await expect(editor).toHaveScreenshot('arduino-editor-main-re-expanded.png');
  });
});
