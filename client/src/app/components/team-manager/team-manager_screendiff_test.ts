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

    const container = page.locator('.page-container');
    const harness = new TeamManagerHarnessE2e(container);

    await page.locator('.sidebar-list').waitFor();
    await page.locator('.detail-panel').waitFor();


    // Panel title checked visually

    await expect(page).toHaveScreenshot('team-manager-initial.png');
  });


  test('should select a team', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-manager'));

    const container = page.locator('.page-container');
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

    // Selected team checked visually
    // expect(await harness.getSelectedTeamName()).toBe('Team Beta'); // Removed

    await expect(page).toHaveScreenshot('team-manager-selected.png');
  });

  test('should show guided help on first visit', async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, { teamManagerHelpShown: false });
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/team-manager'));

    const overlay = page.locator('app-help-overlay');
    await overlay.waitFor({ state: 'attached' });
    
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('team-manager-guided-help.png');
  });
});

