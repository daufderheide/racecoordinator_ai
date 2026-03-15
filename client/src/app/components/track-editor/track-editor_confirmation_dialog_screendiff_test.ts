import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Track Editor Confirmation Dialog', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display confirmation dialog when going back with unsaved changes', async ({ page }) => {
    // 1. Navigate to an existing track
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));

    // 2. Make a change to trigger dirty state (empty name, which is invalid and won't auto-save)
    const nameInput = page.locator('input[name="trackNameInput"]');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('');
    await nameInput.blur();

    // 3. Click the back button
    const backBtn = page.locator('app-back-button .back-btn');
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // 4. Verify the confirmation modal is visible
    const modal = page.locator('app-confirmation-modal .modal-backdrop');
    await expect(modal).toBeVisible();

    // 5. Take a screenshot to verify layering/visibility
    await expect(page).toHaveScreenshot('track-editor-confirmation-modal.png');

    // Modal screenshot taken above, ending test
  });
});
