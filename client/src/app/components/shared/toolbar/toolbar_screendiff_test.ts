import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../../testing/test-setup_helper';
import { ToolbarHarnessE2e } from './testing/toolbar.harness.e2e';

test.describe('Toolbar Component Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display track manager style toolbar', async ({ page }) => {
    // We'll use the track manager page as a host since it uses the toolbar
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));
    
    // Wait for the toolbar to be visible
    const toolbar = page.locator('app-toolbar');
    await expect(toolbar).toBeVisible();
    
    // Snapshot of the toolbar area
    await expect(toolbar).toHaveScreenshot('toolbar-track-manager-style.png');
  });

  test('should display track editor style toolbar', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));
    
    const toolbar = page.locator('.header-right app-toolbar');
    await expect(toolbar).toBeVisible();
    
    await expect(toolbar).toHaveScreenshot('toolbar-track-editor-style.png');
  });

  test('should show hover states', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager'));
    
    const toolbar = page.locator('app-toolbar');
    const harness = new ToolbarHarnessE2e(toolbar);

    await harness.hoverHelp();
    await page.waitForTimeout(200); // Wait for hover transition
    
    await expect(toolbar).toHaveScreenshot('toolbar-help-hover.png');
    
    await harness.hoverDelete();
    await page.waitForTimeout(200);
    
    await expect(toolbar).toHaveScreenshot('toolbar-delete-hover.png');
  });

  test('should show disabled states', async ({ page }) => {
    // In track editor, undo/redo are disabled initially if no changes
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));
    
    const toolbar = page.locator('.header-right app-toolbar');
    await expect(toolbar).toHaveScreenshot('toolbar-editor-disabled-initial.png');
    
    // Test isSaving state in track manager (requires mocking isSaving to true)
    // For now we'll just verify the initial states match expectation.
  });
});
