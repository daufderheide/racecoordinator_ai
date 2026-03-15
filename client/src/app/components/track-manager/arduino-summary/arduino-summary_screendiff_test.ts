import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';
import { ArduinoSummaryHarnessE2e } from './testing/arduino-summary.harness.e2e';

test.describe('Arduino Summary Component Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
  });

  test('should display summary correctly with relays', async ({ page }) => {
    // We need to inject a track with relay config
    await page.route('**/api/tracks', async (route) => {
      const tracks = [
        {
          entity_id: 't-relay',
          name: 'Relay Track',
          lanes: [{ entity_id: 'l1', length: 10, backgroundColor: '#000', foregroundColor: '#fff' }],
          arduino_configs: [{
            hardwareType: 0,
            commPort: 'COM5',
            digitalIds: [0, 0, 3, 0],
            analogIds: [0, 0, 0, 0, 0, 0],
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

    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));

    // Select the relay track
    await page.locator('.sidebar-list').locator('text=Relay Track').click();

    const summaryHost = page.locator('app-arduino-summary');
    const harness = new ArduinoSummaryHarnessE2e(summaryHost);

    // Check summary visibility
    await expect(summaryHost).toBeVisible();
    
    // Expand if needed (it should be expanded by default or we can toggle it)
    if (!(await harness.isExpanded())) {
      await harness.toggleExpanded();
    }

    expect(await harness.getBoardName()).toContain('Arduino Uno');
    expect(await harness.getCommPort()).toBe('COM5');

    // Check checkboxes
    expect(await harness.hasBehavior('Relays')).toBe(true);

    await expect(page).toHaveScreenshot('arduino-summary-with-relays.png');
  });
});

