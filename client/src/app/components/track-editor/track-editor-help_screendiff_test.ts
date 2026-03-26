import { test, expect, Page } from '@playwright/test';
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

  async function navigateToStep(page: Page, harness: HelpOverlayHarnessE2e, targetStep: number) {
    // Navigate with help=true query param to test that entry path
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-editor?id=t1&help=true'));

    // Step 1 is the initial state after navigation, so we click Next (targetStep - 1) times
    for (let i = 1; i < targetStep; i++) {
      await harness.clickNext();
      await waitForPopoverStable(harness);
    }
  }

  const helpSteps = [
    { index: 1, name: 'welcome', label: 'Welcome' },
    { index: 2, name: 'name', label: 'Track Name' },
    { index: 3, name: 'undo-redo', label: 'Undo/Redo' },
    { index: 4, name: 'lanes', label: 'Lane List' },
    { index: 5, name: 'color', label: 'Lane Color' },
    { index: 6, name: 'length', label: 'Lane Length' },
    { index: 7, name: 'delete-lane', label: 'Delete Lane' },
    { index: 8, name: 'add-lane', label: 'Add Lane' },
    { index: 9, name: 'interface-header', label: 'Interface Header' },
    { index: 10, name: 'add-interface', label: 'Add Interface' },
    { index: 11, name: 'interface-panel', label: 'Interface Panel' },
    { index: 12, name: 'hardware', label: 'Interface Hardware' },
    { index: 13, name: 'connection', label: 'Interface Connection' },
    { index: 14, name: 'status', label: 'Serial Status' },
    { index: 15, name: 'debounce', label: 'Debounce' },
  ];

  for (const step of helpSteps) {
    test(`should show help step ${step.index}: ${step.label}`, async ({ page }) => {
      const overlay = page.locator('app-help-overlay');
      const harness = new HelpOverlayHarnessE2e(overlay, page);

      await navigateToStep(page, harness, step.index);
      await waitForPopoverStable(harness);

      await expect(page).toHaveScreenshot(`te-help-step-${step.index}-${step.name}.png`);
    });
  }

  test('should show voltage divider help steps', async ({ page }) => {
    // TODO(aufderheide): Implement this.  Probably need to set an analot pin to voltage divider
    // so the voltage divider config is visible

    // We need a track with a lane configured for Throttle (behavior 2)
    // Standard mocks don't have this, so we'll just verify the basic flow for now.
    // In a real environment, we'd mock the track response specifically for this test.
  });
});
