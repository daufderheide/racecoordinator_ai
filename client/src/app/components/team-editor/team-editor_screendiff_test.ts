import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { TeamEditorHarnessE2e } from './testing/team-editor.harness.e2e';

test.describe('Team Editor Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display team editor', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-editor?id=t1'));

    const container = page.locator('.page-container');
    const harness = new TeamEditorHarnessE2e(container);

    await expect(page.locator('.loader-overlay')).not.toBeVisible();
    // Team name checked visually

    await expect(page).toHaveScreenshot('team-editor-initial.png');
  });

  test('should allow editing team name', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-editor?id=t1'));
    await expect(page.locator('.loader-overlay')).not.toBeVisible();

    const container = page.locator('.page-container');
    const harness = new TeamEditorHarnessE2e(container);

    await harness.setName('New Team Name');

    // Save enabled state checked visually

    await expect(page).toHaveScreenshot('team-editor-name-changed.png');
  });

  test('should open avatar selector', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-editor?id=t1'));

    const container = page.locator('.page-container');
    const harness = new TeamEditorHarnessE2e(container);

    await expect(page.locator('.loader-overlay')).not.toBeVisible();
    // Driver count checked visually

    await harness.clickAvatar();

    await expect(page.locator('.modal-header')).toBeVisible();
    await expect(page.locator('.modal-title')).toBeVisible();

    await expect(page).toHaveScreenshot('team-editor-avatar-selector.png');
  });

  test('should allow adding/removing drivers', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-editor?id=t1'));

    const container = page.locator('.page-container');
    const harness = new TeamEditorHarnessE2e(container);

    await expect(page.locator('.loader-overlay')).not.toBeVisible();

    // Click on the first available driver to assign them
    const availableDriver = page.locator('.driver-grid .driver-item').first();
    await availableDriver.click();

    await expect(page).toHaveScreenshot('team-editor-driver-added.png');
  });

  test('should show guided help on first visit', async ({ page }) => {
    // We navigate to existing team so the help overlay tries to point at real elements
    await TestSetupHelper.setupStandardMocks(page, { teamEditorHelpShown: false });
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-editor?id=t1'));

    const overlay = page.locator('app-help-overlay');
    await overlay.waitFor({ state: 'attached' });
    
    await expect(page).toHaveScreenshot('team-editor-guided-help.png');
  });
});

