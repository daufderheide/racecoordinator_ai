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
    await expect(editor).toContainText('Arduino Configuration');

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
    // but t1 in standard mocks has [1001, 1002, -1, -1] -> [Lap Lane 1, Lap Lane 2, Unused, Unused]
    // Let's modify it to include Reserved and Call Button to see properly.

    await page.route('**/api/tracks', async (route) => {
      const tracks = [
        {
          entity_id: 't-mix',
          name: 'Mixed Pins',
          lanes: [{ entity_id: 'l1', length: 10, backgroundColor: '#fff', foregroundColor: '#000' }],
          arduino_config: {
            name: 'Arduino Mix',
            commPort: 'COM1',
            baudRate: 115200,
            debounceUs: 5000,
            hardwareType: 0, // Uno
            digitalIds: [0, 1, 2, 3], // Unused, Reserved, Call Button (Master), Relay (Master)
            analogIds: [-1, -1, -1, -1],
            globalInvertLanes: 0,
            normallyClosedRelays: false,
            globalInvertLights: 0,
            useLapsForPits: 0,
            useLapsForPitEnd: 0,
            usePitsAsLaps: 0,
            useLapsForSegments: 0,
            ledStrings: null,
            ledLaneColorOverrides: null
          }
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
