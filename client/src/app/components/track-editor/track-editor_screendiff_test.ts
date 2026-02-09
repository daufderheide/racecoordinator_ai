import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';

test.describe('Track Editor Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
  });

  test('should display track editor for existing track', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));

    await expect(page.locator('.page-title')).toContainText('TRACK EDITOR');
    await expect(page.locator('input[name="trackNameInput"]')).toHaveValue('Classic Circuit');

    // Lane Editor
    await expect(page.locator('text=LANE EDITOR')).toBeVisible();
    const laneRows = page.locator('.lane-item');
    await expect(laneRows).toHaveCount(2);

    // Arduino Config
    await expect(page.locator('select').first()).toHaveValue('1'); // Megas is 1

    await expect(page).toHaveScreenshot('track-editor-existing.png');
  });

  test('should display track editor for new track', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=new'));

    await expect(page.locator('.page-title')).toContainText('TRACK EDITOR');
    await expect(page.locator('input[name="trackNameInput"]')).toHaveValue('');

    // Default lanes for new track
    const laneRows = page.locator('.lane-item');
    await expect(laneRows).toHaveCount(2);

    await expect(page).toHaveScreenshot('track-editor-new.png');
  });

  test('should show unsaved changes confirmation', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));

    // Change name
    await page.fill('input[name="trackNameInput"]', 'Modified Track');

    // Click back button (which should trigger confirmation if dirty)
    await page.click('.back-btn');

    // Confirmation modal should appear
    await expect(page.locator('.modal-backdrop')).toBeVisible();
    await expect(page.locator('.modal-title')).toContainText('Unsaved Changes');

    await expect(page).toHaveScreenshot('track-editor-unsaved-changes-modal.png');
  });

  test('should display digital pins grid', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));

    // Scroll to Arduino Config if needed, though it's likely visible in 1600x900
    await expect(page.locator('.pin-grid').first()).toBeVisible();

    // Check if pin 2 is assigned to Lap Lane 1
    // Note: Behavior for Lap Lane 0 is 1000, 1001 is Lap Lane 1
    // The selector/text depends on how it's rendered in .pin-assignment
    await expect(page.locator('.pin-grid').first()).toContainText('Lap Lane 1');

    await expect(page).toHaveScreenshot('track-editor-pins-grid.png');
  });
});
