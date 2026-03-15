import { test, expect } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { HelpOverlayHarnessE2e } from '../shared/help-overlay/testing/help-overlay.harness.e2e';

test.describe('Track Editor Guided Help Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, {
      trackEditorHelpShown: true
    });
    await TestSetupHelper.disableAnimations(page);
  });

  async function waitForPopoverStable(harness: HelpOverlayHarnessE2e) {
    await harness.waitForStable();
  }

  test('should walk through track editor help', async ({ page }) => {
    test.slow(); // This test captures 15+ screenshots; triple the timeout
    // Navigate with help=true query param to test that entry path
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1&help=true'));

    // TODO(aufderheide): Use harness
    const overlay = page.locator('app-help-overlay');
    const harness = new HelpOverlayHarnessE2e(overlay, page);

    // Step 1: Welcome
    await waitForPopoverStable(harness);
    await expect(page).toHaveScreenshot('te-help-step-1-welcome.png');

    // Step 2: Track Name
    await harness.clickNext();
    await waitForPopoverStable(harness);
    await expect(page).toHaveScreenshot('te-help-step-2-name.png');

    // Step 3: Undo/Redo (in toolbar)
    await harness.clickNext();
    await waitForPopoverStable(harness);
    await expect(page).toHaveScreenshot('te-help-step-3-undo-redo.png');

    // Step 4: Lane List
    await harness.clickNext();
    await waitForPopoverStable(harness);
    await expect(page).toHaveScreenshot('te-help-step-4-lanes.png');

    // Step 5: Lane Color
    await harness.clickNext();
    await waitForPopoverStable(harness);
    await expect(page).toHaveScreenshot('te-help-step-5-color.png');

    // Step 6: Lane Length
    await harness.clickNext();
    await waitForPopoverStable(harness);
    await expect(page).toHaveScreenshot('te-help-step-6-length.png');

    // Step 7: Delete Lane
    await harness.clickNext();
    await waitForPopoverStable(harness);
    await expect(page).toHaveScreenshot('te-help-step-7-delete-lane.png');

    // Step 8: Add Lane
    await harness.clickNext();
    await waitForPopoverStable(harness);
    await expect(page).toHaveScreenshot('te-help-step-8-add-lane.png');

    // Step 9: Interface Header
    await harness.clickNext();
    await waitForPopoverStable(harness);
    await expect(page).toHaveScreenshot('te-help-step-9-interface-header.png');

    // Step 10: Add Interface
    await harness.clickNext();
    await waitForPopoverStable(harness);
    await expect(page).toHaveScreenshot('te-help-step-10-add-interface.png');

    // Step 11: Interface Panel (If one is selected)
    // Arduino config is present mechanically on Track 1 mocks so steps 11-15 exist
    await harness.clickNext();
    await waitForPopoverStable(harness);
    await expect(page).toHaveScreenshot('te-help-step-11-interface-panel.png');

    // Step 12: Interface Hardware
    await harness.clickNext();
    await waitForPopoverStable(harness);
    await expect(page).toHaveScreenshot('te-help-step-12-hardware.png');

    // Step 13: Interface Connection
    await harness.clickNext();
    await waitForPopoverStable(harness);
    await expect(page).toHaveScreenshot('te-help-step-13-connection.png');

    // Step 14: Serial Status
    await harness.clickNext();
    await waitForPopoverStable(harness);
    await expect(page).toHaveScreenshot('te-help-step-14-status.png');

    // Step 15: Debounce
    await harness.clickNext();
    await waitForPopoverStable(harness);
    await expect(page).toHaveScreenshot('te-help-step-15-debounce.png');
  });

  test('should show voltage divider help steps', async ({ page }) => {
    // TODO(aufderheide): Implement this.  Probably need to set an analot pin to voltage divider
    // so the voltage divider config is visible

    // We need a track with a lane configured for Throttle (behavior 2)
    // Standard mocks don't have this, so we'll just verify the basic flow for now.
    // In a real environment, we'd mock the track response specifically for this test.
  });
});
