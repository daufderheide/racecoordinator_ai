import { expect, Page, test } from "@playwright/test";
import { HelpOverlayHarnessE2e } from "@app/components/shared/help-overlay/testing/help-overlay.harness.e2e";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Track Editor Guided Help Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, {
      trackEditorHelpShown: true,
    });
    await TestSetupHelper.disableAnimations(page);
  });

  async function waitForPopoverStable(harness: HelpOverlayHarnessE2e) {
    await harness.waitForStable();
  }

  async function enterEditMode(page: any) {
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });
    await page.locator("#edit-track-btn").click();
    await expect(page.locator("#track-name-input")).toBeEnabled();
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await TestSetupHelper.disableAnimations(page);
  }

  async function navigateToStep(
    page: Page,
    harness: HelpOverlayHarnessE2e,
    targetStep: number,
  ) {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );

    await enterEditMode(page);

    await page.locator("#help-track-btn").click();
    await waitForPopoverStable(harness);

    // Step 1 is the initial state after navigation, so we click Next (targetStep - 1) times
    for (let i = 1; i < targetStep; i++) {
      await harness.clickNext();
      await waitForPopoverStable(harness);
    }
  }

  const helpSteps = [{ index: 1, name: "welcome", label: "Welcome" }];

  for (const step of helpSteps) {
    test(`should show help step ${step.index}: ${step.label}`, async ({
      page,
    }) => {
      const overlay = page.locator("app-help-overlay");
      const harness = new HelpOverlayHarnessE2e(overlay, page);

      await navigateToStep(page, harness, step.index);
      await waitForPopoverStable(harness);

      await expect(page).toHaveScreenshot(
        `te-help-step-${step.index}-${step.name}.png`,
      );
    });
  }
});
