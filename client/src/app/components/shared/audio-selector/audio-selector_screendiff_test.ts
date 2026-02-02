import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';

test.describe('Audio Selector Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
  });

  test('should display audio selector', async ({ page }) => {
    // Navigate to Driver Editor which uses Audio Selector
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-editor?id=d1'));
    await TestSetupHelper.waitForText(page, 'DRIVER CONFIGURATION');

    // Locate an audio selector (e.g. Lap Sound)
    // We might need to target a specific one if there are multiple, or just taking the first one
    const audioSelector = page.locator('app-audio-selector').first();
    await expect(audioSelector).toBeVisible();

    // Screenshot just the audio selector component
    await expect(audioSelector).toHaveScreenshot('audio-selector.png');
  });
});
