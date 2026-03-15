import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { TeamManagerHarnessE2e } from './testing/team-manager.harness.e2e';

test.describe('Team Manager Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display team list', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-manager'));

    const container = page.locator('.dm-container');
    const harness = new TeamManagerHarnessE2e(container);

    await expect(page.locator('.list-panel')).toBeVisible();
    await expect(page.locator('.config-panel')).toBeVisible();

    await expect(page.locator('.panel-title')).toContainText('TEAMS');

    await expect(page).toHaveScreenshot('team-manager-initial.png');
  });

  test('should filter team list', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-manager'));

    const container = page.locator('.dm-container');
    const harness = new TeamManagerHarnessE2e(container);

    await harness.setSearchQuery('Beta');

    expect(await harness.getTeamCount()).toBe(1);
    expect(await harness.getTeamName(0)).toContain('Team Beta');

    await expect(page).toHaveScreenshot('team-manager-filtered.png');
  });

  test('should select a team', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-manager'));

    const container = page.locator('.dm-container');
    const harness = new TeamManagerHarnessE2e(container);

    // Find index of Team Beta
    const count = await harness.getTeamCount();
    let betaIndex = -1;
    for (let i = 0; i < count; i++) {
        if ((await harness.getTeamName(i)).includes('Team Beta')) {
            betaIndex = i;
            break;
        }
    }
    
    expect(betaIndex).toBeGreaterThan(-1);
    await harness.selectTeam(betaIndex);

    expect(await harness.getSelectedTeamName()).toBe('Team Beta');

    await expect(page).toHaveScreenshot('team-manager-selected.png');
  });
});

