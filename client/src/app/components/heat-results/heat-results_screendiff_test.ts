import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Heat Results Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display dual charts for heat results', async ({ page }) => {
    // Setup Mock Race and Heat data with Laps populated in state triggers
    await page.evaluate(() => {
       // We can mock window.mockRaceData if existing helper supports it or mock API endpoints triggers.
       // TestSetupHelper typically hooks into service providers setups.
       // Assuming setupStandardMocks creates a running race context framing accurately.
    });

    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/heat-results'));

    // Verify Loader not covering canvas 
    await expect(page.locator('.loader-overlay')).not.toBeVisible();

    // Visual screenshot verification
    await expect(page).toHaveScreenshot('heat-results-charts.png', {
         maxDiffPixelRatio: 0.05 // allowance for dynamic elements triggers.
    });
  });
});
