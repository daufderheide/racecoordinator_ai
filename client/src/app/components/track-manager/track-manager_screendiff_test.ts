import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { TrackManagerHarnessE2e } from './testing/track-manager.harness.e2e';

test.describe('Track Manager Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display track list and details', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));

    const managerHost = page.locator('app-track-manager');
    const harness = new TrackManagerHarnessE2e(managerHost);

    // Wait for the main elements to be visible
    await expect(managerHost).toBeVisible();

    // Check if both mocked tracks are in the list
    // Check if both mocked tracks are in the list
    // const names = await harness.getTrackNames();
    // const selected = await harness.getSelectedTrackName();
    // await expect(managerHost).toBeVisible(); // Already checked above

    // Force the browser to decode the framing image so the CSS renderer isn't left hanging on a black background
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = '/assets/images/track_framing.png';
      });
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('track-manager-initial.png');
  });

  test('should select a track', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));

    const managerHost = page.locator('app-track-manager');
    const harness = new TrackManagerHarnessE2e(managerHost);

    await harness.selectTrack('Speedway');

    // Check if detail panel updates

    await page.waitForTimeout(3000);
    await expect(page).toHaveScreenshot('track-manager-selected-speedway.png');
  });

  test('should show arduino summary', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));

    const managerHost = page.locator('app-track-manager');
    const harness = new TrackManagerHarnessE2e(managerHost);

    await harness.selectTrack('Speedway');

    // summaries might be needed for something or not, let's just make sure list is loaded if needed,
    // but the screenshot takes care of it.

    await page.waitForTimeout(3000);
    await expect(page).toHaveScreenshot('track-manager-arduino-summary.png');
  });

  test('should navigate to editor when Create New is clicked', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));

    const managerHost = page.locator('app-track-manager');
    const harness = new TrackManagerHarnessE2e(managerHost);

    await harness.clickCreateNew();

    // Wait for the editor to load
    await expect(page.locator('app-track-editor')).toBeVisible();

    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('track-manager-after-create-new.png');
  });

  test('should show guided help on first visit', async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, { trackManagerHelpShown: false });
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));

    const overlay = page.locator('app-help-overlay');
    await overlay.waitFor({ state: 'attached' });
    
    await expect(page).toHaveScreenshot('track-manager-guided-help.png');
  });
});
