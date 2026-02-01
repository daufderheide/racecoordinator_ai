import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Driver Editor Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await TestSetupHelper.setupAssetMocks(page);

    // Mock drivers specifically for this test
    await page.route('**/api/drivers', async route => {
      await route.fulfill({
        json: [
          {
            entity_id: 'd1',
            name: 'Test Driver',
            nickname: 'Speedy',
            avatarUrl: 'assets/images/default_avatar.svg',
            lapSoundUrl: '',
            bestLapSoundUrl: '',
            lapSoundType: 'preset',
            bestLapSoundType: 'preset',
            lapSoundText: '',
            bestLapSoundText: ''
          }
        ]
      });
    });
  });

  test('should display driver editor with driver loaded', async ({ page }) => {
    // Navigate to Driver Editor with an ID
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/driver-editor?id=d1'));
    await TestSetupHelper.waitForText(page, 'DRIVER CONFIGURATION');

    // Verify inputs are populated (first .dm-input is Name)
    const nameInput = page.locator('.dm-input').first();
    await expect(nameInput).toHaveValue('Test Driver');

    // Screenshot the whole page
    await expect(page).toHaveScreenshot('driver-editor-loaded.png');
  });
});
