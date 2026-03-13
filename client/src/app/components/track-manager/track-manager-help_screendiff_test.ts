import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Track Manager Guided Help Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, { 
      trackManagerHelpShown: true 
    });
    await TestSetupHelper.disableAnimations(page);
  });

  async function waitForPopoverStable(page: any, overlay: any) {
    const popover = overlay.locator('.help-popover');
    await expect(popover).toBeVisible();
    await page.waitForTimeout(600); // Sufficient for transitions
  }

  test('should walk through track manager help', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));
    
    // Select Speedway to ensure detail panel is populated
    await page.locator('.sidebar-list').locator('text=Speedway').click();
    await page.waitForTimeout(500);

    // Click Help button in toolbar
    const helpBtn = page.locator('#help-track-btn');
    await helpBtn.click();

    const overlay = page.locator('app-help-overlay');
    const nextBtn = overlay.locator('.btn-next');

    // Step 1: Welcome
    await waitForPopoverStable(page, overlay);
    await expect(page).toHaveScreenshot('tm-help-step-1-welcome.png');

    // Step 2: Sidebar
    await nextBtn.click();
    await waitForPopoverStable(page, overlay);
    await expect(page).toHaveScreenshot('tm-help-step-2-sidebar.png');

    // Step 3: Detail Panel
    await nextBtn.click();
    await waitForPopoverStable(page, overlay);
    await expect(page).toHaveScreenshot('tm-help-step-3-detail.png');

    // Step 4: Edit Button (in toolbar)
    await nextBtn.click();
    await waitForPopoverStable(page, overlay);
    await expect(page).toHaveScreenshot('tm-help-step-4-edit.png');

    // Step 5: Help Button
    await nextBtn.click();
    await waitForPopoverStable(page, overlay);
    await expect(page).toHaveScreenshot('tm-help-step-5-help.png');

    // Step 6: Delete Button
    await nextBtn.click();
    await waitForPopoverStable(page, overlay);
    await expect(page).toHaveScreenshot('tm-help-step-6-delete.png');

    // Step 7: Create New
    await nextBtn.click();
    await waitForPopoverStable(page, overlay);
    await expect(page).toHaveScreenshot('tm-help-step-7-create.png');
  });
});
