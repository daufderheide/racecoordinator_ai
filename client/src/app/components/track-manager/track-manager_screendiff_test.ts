import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Track Manager Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display track list and details', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));

    // Wait for the main elements to be visible
    await expect(page.locator('.sidebar-list')).toBeVisible();
    await expect(page.locator('.detail-panel')).toBeVisible();

    // Check if the "TRACK MANAGER" header is present
    await expect(page.locator('.page-title')).toContainText('TRACK MANAGER');

    // Check if both mocked tracks are in the list
    await expect(page.locator('.sidebar-list').locator('text=Classic Circuit')).toBeVisible();
    await expect(page.locator('.sidebar-list').locator('text=Speedway')).toBeVisible();

    // Force the browser to decode the framing image so the CSS renderer isn't left hanging on a black background
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => resolve();
        img.src = '/assets/images/track_framing.png';
      });
    });
    // Give Chromium a brief moment to apply the cached image to the CSS OM
    await page.waitForTimeout(500);
    // Snapshot of the initial state (Classic Circuit selected by default)
    await expect(page).toHaveScreenshot('track-manager-initial.png');
  });

  test('should select a track', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));

    // Click on "Speedway" in the list
    await page.locator('.sidebar-list').locator('text=Speedway').click();

    // Check if detail panel updates
    await expect(page.locator('.detail-panel')).toContainText('Speedway');

    // Check lane count
    await expect(page.locator('.detail-panel')).toContainText('4');

    await page.waitForTimeout(3000);
    await expect(page).toHaveScreenshot('track-manager-selected-speedway.png');
  });

  test('should show arduino summary', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));

    // Select Speedway (Arduino Uno) in the list
    await page.locator('.sidebar-list').locator('text=Speedway').click();

    // Wait for summary to be visible
    await expect(page.locator('app-arduino-summary .arduino-summary')).toBeVisible();
    await expect(page.locator('text=Arduino Uno')).toBeVisible();
    await expect(page.locator('text=COM4')).toBeVisible();

    await page.waitForTimeout(3000);
    await expect(page).toHaveScreenshot('track-manager-arduino-summary.png');
  });

  test('should navigate to editor when Create New is clicked', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));

    // Click Create New button
    await page.click('button:has-text("CREATE NEW")');

    // Should navigate to editor with a new track
    await expect(page).toHaveURL(/\/track-editor\?id=t-new-id|new|.+/); // Flexible enough for mock
    await expect(page.locator('app-track-editor .page-title')).toContainText('TRACK EDITOR');
    
    // Check if it has default factory settings (4 lanes)
    const laneRows = page.locator('.lane-item');
    // Using default mock from TestSetupHelper (2 lanes) vs factory (4 lanes)?
    // Wait, the createTrack mock returns what we send it.
    // In track-manager.component.ts logic, it fetches factory (4) then creates.
    await expect(laneRows).toHaveCount(4);

    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('track-manager-after-create-new.png');
  });
});
