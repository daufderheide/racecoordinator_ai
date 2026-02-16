import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Team Editor Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display team editor', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-editor?id=t1'));

    await expect(page.locator('.loader-overlay')).not.toBeVisible();
    await expect(page.locator('.dm-container')).toBeVisible();
    await expect(page.locator('.config-panel')).toBeVisible();

    // Snapshot of the initial state
    await expect(page).toHaveScreenshot('team-editor-initial.png');
  });

  test('should allow editing team name', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-editor?id=t1'));
    await expect(page.locator('.loader-overlay')).not.toBeVisible();

    await page.fill('input.dm-input', 'New Team Name');

    // Check if the button is enabled after change
    await expect(page.locator('button.btn-save')).toBeEnabled();

    await expect(page).toHaveScreenshot('team-editor-name-changed.png');
  });

  test('should open avatar selector', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-editor?id=t1'));

    // Wait for the loader to disappear and data to be rendered
    await expect(page.locator('.loader-overlay')).not.toBeVisible();
    await expect(page.locator('.driver-item')).toHaveCount(4, { timeout: 10000 });

    // Click on avatar to open selector
    const avatar = page.locator('.avatar-preview-large');
    await expect(avatar).toBeVisible();
    await avatar.click({ force: true });

    // Wait for the modal header to be visible (indicates *ngIf="visible" is true)
    await expect(page.locator('.modal-header')).toBeVisible({ timeout: 10000 });

    // Wait for the specific text from en.json (TEM_TITLE_SELECT_AVATAR: "SELECT AVATAR")
    await expect(page.locator('.modal-title')).toBeVisible();

    await expect(page).toHaveScreenshot('team-editor-avatar-selector.png');
  });

  test('should allow adding/removing drivers', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-editor?id=t1'));

    await expect(page.locator('.loader-overlay')).not.toBeVisible();
    await expect(page.locator('.driver-item')).toHaveCount(4, { timeout: 10000 });

    // Initial count should be 2 for Team Alpha (d1, d2)
    await expect(page.locator('.driver-item.selected')).toHaveCount(2);

    // Click on the first selected driver to remove it
    await page.click('.driver-item.selected:has-text("Alice")');

    await expect(page.locator('.driver-item.selected')).toHaveCount(1);

    await expect(page).toHaveScreenshot('team-editor-driver-removed.png');
  });
});
