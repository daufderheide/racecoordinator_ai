import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Track Manager UI Refinements', () => {
  test.beforeEach(async ({ page }) => {
    // Standard mocks but override tracks with many tracks
    await TestSetupHelper.setupStandardMocks(page, { skipIntro: true });
    await TestSetupHelper.setupManyTracksMock(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should show vertical scrollbar and truncate long names in sidebar', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));
    
    // Wait for the list to be populated
    const listItems = page.locator('.list-item');
    await expect(listItems).toHaveCount(20);

    // Capture the sidebar state (scrollbar and truncation)
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('track-manager-sidebar-scrolling-truncation.png');
  });

  test('should truncate long track name in summary title', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));

    // Select the 5th track (which has the extremely long name)
    const longNameTrack = page.locator('.list-item').nth(4);
    await longNameTrack.click();

    // Verify the summary title exists
    const summaryTitle = page.locator('.detail-header h2');
    await expect(summaryTitle).toBeVisible();
    
    // Check for ellipsis (via screenshot verification)
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('track-manager-summary-title-truncation.png');
  });
});
