
import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { RacedaySetupHarnessE2e } from './testing/raceday-setup.harness.e2e';

test.describe('Connection Loss Visuals', () => {
  test('should display transparent overlay when connection is lost', async ({ page }) => {
    await page.clock.install();

    let connectionSucceeds = true;
    await page.route('**/api/drivers', async route => {
      if (connectionSucceeds) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { entity_id: 'd1', name: 'Alice', nickname: 'The Rocket' },
            { entity_id: 'd2', name: 'Bob', nickname: 'Drift King' },
          ]),
        });
      } else {
        await route.abort('failed');
      }
    });

    await page.route('**/api/races', async route => {
      if (connectionSucceeds) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              entity_id: 'r1',
              name: 'Grand Prix',
              track: { name: 'Mock Track', entity_id: 't1' }
            },
            {
              entity_id: 'r2',
              name: 'Time Trial',
              track: { name: 'Mock Track', entity_id: 't1' }
            },
          ]),
        });
      } else {
        await route.abort('failed');
      }
    });

    await page.route('**/api/teams', async route => {
      if (connectionSucceeds) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { entity_id: 't1', name: 'Team Alpha', avatarUrl: '' }
          ]),
        });
      } else {
        await route.abort('failed');
      }
    });

    await TestSetupHelper.setupLocalizationMocks(page);
    await TestSetupHelper.setupAssetMocks(page);

    await TestSetupHelper.setupLocalStorage(page, {
      racedaySetupWalkthroughSeen: true
    });

    await page.goto('/');
    await TestSetupHelper.disableAnimations(page);

    const container = page.locator('.shell-container');
    const harness = new RacedaySetupHarnessE2e(container);

    await page.clock.fastForward(5500);

    expect(await harness.isSplashScreenVisible()).toBe(false);

    await expect(page.locator('.menu-bar')).toBeVisible();

    connectionSucceeds = false;

    await page.clock.fastForward(5500);

    expect(await harness.isConnectionLostOverlayVisible()).toBe(true);

    // Connection lost text checked visually

    await page.waitForTimeout(1000);

    await expect(page).toHaveScreenshot('connection-lost-overlay.png', {
      mask: [
        page.locator('.quote-text'),
        page.locator('.quote-container'),
        page.locator('.version-container'),
        page.locator('.spinner')
      ],
      maxDiffPixelRatio: 0.05,
      threshold: 0.2
    });
  });
});

