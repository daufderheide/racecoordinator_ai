import { test, expect, Page } from '@playwright/test';
import { TestSetupHelper } from '../../testing/test-setup_helper';
import { HelpOverlayHarnessE2e } from '../shared/help-overlay/testing/help-overlay.harness.e2e';

test.describe('Track Manager Guided Help Visuals', () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, { 
      trackManagerHelpShown: true 
    });
    await TestSetupHelper.disableAnimations(page);
  });

  async function waitForPopoverStable(harness: HelpOverlayHarnessE2e) {
    await harness.waitForStable();
  }

  async function navigateToStep(page: Page, harness: HelpOverlayHarnessE2e, targetStep: number) {
    // Navigate with help=true query param to trigger help automatically
    // We also select Speedway to ensure detail panel is populated
    await TestSetupHelper.waitForLocalization(page, 'en', page.goto('/track-manager?help=true&selectedId=t1'));

    // Step 1 is the initial state after navigation, so we click Next (targetStep - 1) times
    for (let i = 1; i < targetStep; i++) {
      await harness.clickNext();
      await waitForPopoverStable(harness);
    }
  }

  const helpSteps = [
    { index: 1, name: 'welcome', label: 'Welcome' },
    { index: 2, name: 'sidebar', label: 'Sidebar' },
    { index: 3, name: 'detail', label: 'Detail Panel' },
    { index: 4, name: 'edit', label: 'Edit Button' },
    { index: 5, name: 'create', label: 'Create New Button' },
    { index: 6, name: 'delete', label: 'Delete Button' },
    { index: 7, name: 'help', label: 'Help Button' },
  ];

  for (const step of helpSteps) {
    test(`should show help step ${step.index}: ${step.label}`, async ({ page }) => {
      const overlay = page.locator('app-help-overlay');
      const harness = new HelpOverlayHarnessE2e(overlay, page);

      await navigateToStep(page, harness, step.index);
      await waitForPopoverStable(harness);

      await expect(page).toHaveScreenshot(`tm-help-step-${step.index}-${step.name}.png`);
    });
  }
});
