import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { TrackEditorHarnessE2e } from './testing/track-editor.harness.e2e';
import { ConfirmationModalHarnessE2e } from '../shared/confirmation-modal/testing/confirmation-modal.harness.e2e';

test.describe('Track Editor Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test('should display track editor for existing track', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));

    const editor = page.locator('app-track-editor');
    const harness = new TrackEditorHarnessE2e(editor);

    await expect(editor).toBeVisible();

    expect(await harness.getTrackName()).toBe('Classic Circuit');

    // Lane Editor
    expect(await harness.getLaneCount()).toBe(2);

    // Arduino Config
    const arEditors = await harness.getArduinoEditorHarnesses();
    expect(arEditors.length).toBeGreaterThan(0);
    expect(await arEditors[0].getBoardType()).toBe('1'); // Mega

    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('track-editor-existing.png');
  });

  test('should display track editor for new track', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=new'));

    const editor = page.locator('app-track-editor');
    const harness = new TrackEditorHarnessE2e(editor);

    await expect(editor).toBeVisible();

    expect(await harness.getTrackName()).toBe('New Track');

    // Default lanes for new track
    expect(await harness.getLaneCount()).toBe(4);

    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('track-editor-new.png');
  });

  test('should show unsaved changes confirmation', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));

    const editor = page.locator('app-track-editor');
    const harness = new TrackEditorHarnessE2e(editor);

    await harness.setTrackName('Modified Track');

    // Click back button
    await page.click('.back-btn');

    // Confirmation modal should appear
    const modalHost = page.locator('app-confirmation-modal');
    const modal = new ConfirmationModalHarnessE2e(modalHost);

    await expect(modalHost).toBeVisible();
    expect(await modal.getTitle()).toContain('Unsaved Changes');

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

    // Verify pin 2 action
    expect(await arHarness.getSelectedPinAction(true, 2)).toContain('Lap'); 

    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('track-editor-pins-grid.png');
  });

  test('should highlight track name in red when duplicate', async ({ page }) => {
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1'));

    const editor = page.locator('app-track-editor');
    const harness = new TrackEditorHarnessE2e(editor);

    await harness.setTrackName('Speedway');
    
    expect(await harness.isNameInvalid()).toBe(true);

    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('track-editor-duplicate-name-error.png');
  });
});

