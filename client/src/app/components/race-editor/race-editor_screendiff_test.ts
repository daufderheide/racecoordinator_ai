import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Race Editor Visuals', () => {
  test.beforeEach(async ({ page }) => {
    // Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceMocks(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForLoadState('networkidle');


    // Mock Heat Preview API
    await page.route('**/api/heats/preview', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          heats: [
            {
              heatNumber: 1,
              lanes: [
                { laneNumber: 1, driverNumber: 1, backgroundColor: '#ff0000', foregroundColor: '#ffffff' },
                { laneNumber: 2, driverNumber: 2, backgroundColor: '#00ff00', foregroundColor: '#000000' }
              ]
            }
          ]
        }),
      });
    });
  });

  test('should display race editor for existing race', async ({ page }) => {
    // Navigate to Race Editor
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/race-editor?id=r1&driverCount=4'));

    // Verify Editor Form is attached
    await page.waitForTimeout(2000);
    await expect(page.locator('.editor-form')).toBeAttached({ timeout: 10000 });
    await expect(page.locator('app-heat-list')).toBeAttached({ timeout: 10000 });

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the entire editor
    await expect(page).toHaveScreenshot('race-editor.png');
  });

  test('should display validation error for duplicate name', async ({ page }) => {
    // Navigate to Race Editor
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/race-editor?id=r1&driverCount=4'));

    // Change name to a duplicate (standard mock setup has 'r1' as 'Grand Prix', we'll change it to 'Time Trial' which is 'r2')
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('Time Trial');
    await nameInput.blur();

    // Verify update button is disabled or has tooltip (depending on implementation - checking for disabled state)
    const updateBtn = page.locator('.btn-update');
    await page.waitForTimeout(2000);
    await expect(updateBtn).toBeDisabled();

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the name input area showing the potential error style if any
    await expect(page).toHaveScreenshot('race-editor-duplicate-name.png');
  });

  test('should show error modal on save failure', async ({ page }) => {
    // Navigate to Race Editor
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/race-editor?id=r1&driverCount=4'));

    // Mock save failure
    await page.route('**/api/races/r1', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify('Internal Server Error')
        });
      } else {
        await route.continue();
      }
    });

    // Make a change
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.click();
    await nameInput.fill('Updated Name');
    await nameInput.blur();
    await page.waitForTimeout(500);

    // Click update
    const updateBtn = page.locator('.btn-update');
    await expect(updateBtn).toBeEnabled();
    await updateBtn.click();

    // Verify Error Modal (app-acknowledgement-modal .modal-backdrop)
    await page.waitForTimeout(2000);
    const backdrop = page.locator('app-acknowledgement-modal .modal-backdrop');
    await expect(backdrop).toBeAttached({ timeout: 10000 });
    await expect(backdrop).toBeVisible({ timeout: 10000 });

    // Disable animations
    await TestSetupHelper.disableAnimations(page);

    // Screenshot the error modal
    await expect(backdrop).toHaveScreenshot('race-editor-save-error.png');
  });
});
