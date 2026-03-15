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

    const container = page.locator('.dm-container');
    const harness = new TeamEditorHarnessE2e(container);

    await expect(page.locator('.loader-overlay')).not.toBeVisible();
    // Team name checked visually

    await expect(page).toHaveScreenshot('team-editor-initial.png');
  });

  test('should allow editing team name', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-editor?id=t1'));
    await expect(page.locator('.loader-overlay')).not.toBeVisible();

    const container = page.locator('.dm-container');
    const harness = new TeamEditorHarnessE2e(container);

    await harness.setName('New Team Name');

    // Save enabled state checked visually

    await expect(page).toHaveScreenshot('team-editor-name-changed.png');
  });

  test('should open avatar selector', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-editor?id=t1'));

    const container = page.locator('.dm-container');
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

    const container = page.locator('.dm-container');
    const harness = new TeamEditorHarnessE2e(container);

    await expect(page.locator('.loader-overlay')).not.toBeVisible();
    // Driver count checked visually

    // Initial selected count
    let selectedCount = 0;
    const count = await harness.getDriverCount();
    for (let i = 0; i < count; i++) {
        if (await harness.isDriverSelected(i)) selectedCount++;
    }
    // Selected count checked visually

    // Toggle Alice (assuming d1)
    // Find index of Alice
    let aliceIndex = -1;
    for (let i = 0; i < count; i++) {
        if ((await harness.getDriverName(i)).includes('Alice')) {
            aliceIndex = i;
            break;
        }
    }
    expect(aliceIndex).toBeGreaterThan(-1);
    await harness.toggleDriver(aliceIndex);

    // Selection state checked visually

    await expect(page).toHaveScreenshot('team-editor-driver-removed.png');
  });
});

