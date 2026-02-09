import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';

test.describe('Arduino Summary Component Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
  });

  test('should display summary correctly with relays', async ({ page }) => {
    // We need to inject a track with relay config
    // We can do this by overriding the track mocks or just using what implies relay behavior
    // The Standard Mocks in TestSetupHelper don't explicitly have Relay pins (ID 3 or 4000+)
    // So let's override the track mock for this specific test file or test case.

    // We'll re-implement setupTrackMocks locally to include relays
    await page.route('**/api/tracks', async (route) => {
      const tracks = [
        {
          entity_id: 't-relay',
          name: 'Relay Track',
          lanes: [{ entity_id: 'l1', length: 10, backgroundColor: '#000', foregroundColor: '#fff' }],
          arduino_config: {
            name: 'Arduino Relay',
            commPort: 'COM5',
            baudRate: 115200,
            debounceUs: 5000,
            hardwareType: 0,
            digitalIds: [3, 4000, -1, -1], // 3=Master Relay, 4000=Lane Relay
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

    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));

    // Select the relay track
    await page.locator('.sidebar-list').locator('text=Relay Track').click();

    // Check summary visibility
    const summary = page.locator('.arduino-summary');
    await expect(summary).toBeVisible();
    await expect(summary).toContainText('Arduino Uno');
    await expect(summary).toContainText('COM5');

    // Check checkboxes
    // Relay should be checked
    // We need to target the relay checkbox specifically.
    // The structure is .behavior-check containing text "Relays"
    const relayCheck = summary.locator('.behavior-check', { hasText: 'Relays' });
    await expect(relayCheck.locator('.check-box')).toHaveClass(/checked/);

    await expect(page).toHaveScreenshot('arduino-summary-with-relays.png');
  });
});
