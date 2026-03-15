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
    const names = await harness.getTrackNames();
    expect(names).toContain('Classic Circuit');
    expect(names).toContain('Speedway');

    // Check selected track
    expect(await harness.getSelectedTrackName()).toBe('Classic Circuit');

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
    expect(await harness.getSelectedTrackName()).toBe('Speedway');

    await page.waitForTimeout(3000);
    await expect(page).toHaveScreenshot('track-manager-selected-speedway.png');
  });

  test('should show arduino summary', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));

    const managerHost = page.locator('app-track-manager');
    const harness = new TrackManagerHarnessE2e(managerHost);

    await harness.selectTrack('Speedway');

    const summaries = await harness.getArduinoSummaryHarnesses();
    expect(summaries.length).toBeGreaterThan(0);
    
    const summary = summaries[0];
    expect(await summary.getBoardName()).toContain('Arduino Uno');
    expect(await summary.getCommPort()).toBe('COM4');

    await page.waitForTimeout(3000);
    await expect(page).toHaveScreenshot('track-manager-arduino-summary.png');
  });

  test('should navigate to editor when Create New is clicked', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));

    const managerHost = page.locator('app-track-manager');
    const harness = new TrackManagerHarnessE2e(managerHost);

    await harness.clickCreateNew();

    // Should navigate to editor with a new track
    await expect(page).toHaveURL(/\/track-editor\?id=t-new-id|new|.+/);
    await expect(page.locator('app-track-editor .page-title')).toContainText('TRACK EDITOR');
    
    const laneRows = page.locator('.lane-item');
    await expect(laneRows).toHaveCount(4);

    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('track-manager-after-create-new.png');
  });
});

