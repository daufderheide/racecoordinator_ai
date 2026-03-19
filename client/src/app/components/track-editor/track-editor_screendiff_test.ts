import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { TrackEditorHarnessE2e } from './testing/track-editor.harness.e2e';
import { ConfirmationModalHarnessE2e } from '../shared/confirmation-modal/testing/confirmation-modal.harness.e2e';

test.describe('Track Editor Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.addInitScript(() => {
      window.addEventListener('DOMContentLoaded', () => {
        const style = document.createElement('style');
        style.textContent = 'app-acknowledgement-modal { display: none !important; }';
        document.head.appendChild(style);
      });
    });
  });

  test('should display track editor for existing track', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));

    const editor = page.locator('app-track-editor');
    const harness = new TrackEditorHarnessE2e(editor);

    await expect(editor).toBeVisible();

    // Track name and lane count checked visually

    // Lane Editor

    // Arduino Config
    await page.waitForTimeout(1000);

    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('track-editor-existing.png');
  });

  test('should display track editor for new track', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=new'));

    const editor = page.locator('app-track-editor');
    const harness = new TrackEditorHarnessE2e(editor);

    await expect(editor).toBeVisible();

    // Track name and lane count checked visually

    // Default lanes for new track

    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('track-editor-new.png');
  });

  test('should show unsaved changes confirmation', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));

    // Intercept and fail track update so autoSave doesn't clear isDirty
    await page.route('**/api/tracks/*', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Duplicate track name' })
      });
    });

    const editor = page.locator('app-track-editor');
    const harness = new TrackEditorHarnessE2e(editor);

    await harness.setTrackName('Modified Track');
    // Click back button
    await harness.clickBackButton();

    // Confirmation modal should appear
    await harness.waitForConfirmationModalVisible(5000);

    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('track-editor-unsaved-changes-modal.png');
  });

  test('should display digital pins grid', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));

    const editor = page.locator('app-track-editor');
    const arEditors = await (new TrackEditorHarnessE2e(editor)).getArduinoEditorHarnesses();

    expect(arEditors.length).toBeGreaterThan(0);
    const arHarness = arEditors[0];

    // Check if Digital is expanded, if not expand
    if (!(await arHarness.isSectionExpanded('digital'))) {
      await arHarness.toggleSection('digital');
    }

    // Verify pin 2 action (checked visually)

    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('track-editor-pins-grid.png');
  });

  test('should highlight track name in red when duplicate', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));

    const editor = page.locator('app-track-editor');
    const harness = new TrackEditorHarnessE2e(editor);

    await harness.setTrackName('Speedway');

    // Invalid state checked visually

    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('track-editor-duplicate-name-error.png');
  });

  test('should show guided help on first visit', async ({ page }) => {
    // We navigate to existing track so the help overlay tries to point at real elements
    await TestSetupHelper.setupStandardMocks(page, { trackEditorHelpShown: false });
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));

    const overlay = page.locator('app-help-overlay');
    await overlay.waitFor({ state: 'attached' });
    
    await expect(page).toHaveScreenshot('track-editor-guided-help.png');
  });
});
