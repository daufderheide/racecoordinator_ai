import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';
import { BackButtonHarnessE2e } from './testing/back-button.harness.e2e';

test.describe('Back Button Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
  });

  test('should display back button', async ({ page }) => {
    // Navigate to Asset Manager
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/asset-manager'));
    
    // Verify Back Button is visible
    const backButtonHost = page.locator('app-back-button');
    await backButtonHost.waitFor({ state: 'visible' });
    const harness = new BackButtonHarnessE2e(backButtonHost);
    
    // Label text checked visually

    // Screenshot the back button area
    // Just screenshot the button itself to be precise
    await expect(backButtonHost).toHaveScreenshot('back-button.png', { maxDiffPixelRatio: 0.05 });
  });
});
