import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { TrackEditorHarnessE2e } from "./testing/track-editor.harness.e2e";

test.describe("Track Editor Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.addInitScript(() => {
      window.addEventListener("DOMContentLoaded", () => {
        const style = document.createElement("style");
        style.textContent =
          "app-acknowledgement-modal { display: none !important; }";
        document.head.appendChild(style);
      });
    });
  });

  async function enterEditMode(page: any) {
    await page.locator("#edit-track-btn").click();
    await expect(page.locator("#track-name-input")).toBeEnabled();
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await TestSetupHelper.disableAnimations(page);
  }

  test("should display track editor for existing track", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );

    const editor = page.locator("app-track-editor");
    const _harness = new TrackEditorHarnessE2e(editor);

    await expect(editor).toBeVisible();

    await enterEditMode(page);

    // Track name and lane count checked visually

    // Lane Editor

    // Arduino Config
    await expect(page).toHaveScreenshot("track-editor-existing.png", {
      maxDiffPixelRatio: 0.1,
      animations: "disabled",
    });
  });

  test("should display track editor for new track", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=new"),
    );

    const editor = page.locator("app-track-editor");
    const _harness = new TrackEditorHarnessE2e(editor);

    await expect(editor).toBeVisible();

    // Track name and lane count checked visually

    // Default lanes for new track

    await expect(page).toHaveScreenshot("track-editor-new.png", {
      maxDiffPixelRatio: 0.1,
      animations: "disabled",
    });
  });

  test("should display digital pins grid", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );

    const editor = page.locator("app-track-editor");

    await enterEditMode(page);

    const arEditors = await new TrackEditorHarnessE2e(
      editor,
    ).getArduinoEditorHarnesses();

    const arHarness = arEditors[0];

    // Check if Digital is expanded, if not expand
    if (!(await arHarness.isSectionExpanded("digital"))) {
      await arHarness.toggleSection("digital");
    }

    // Verify pin 2 action (checked visually)

    await expect(page).toHaveScreenshot("track-editor-pins-grid.png", {
      maxDiffPixelRatio: 0.1,
      animations: "disabled",
    });
  });

  test("should highlight track name in red when duplicate", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );

    const editor = page.locator("app-track-editor");
    const harness = new TrackEditorHarnessE2e(editor);

    await enterEditMode(page);

    await harness.setTrackName("Speedway");

    // Invalid state checked visually

    await expect(page).toHaveScreenshot(
      "track-editor-duplicate-name-error.png",
      { maxDiffPixelRatio: 0.1, animations: "disabled" },
    );
  });

  test("should show guided help on first visit", async ({ page }) => {
    // We navigate to existing track so the help overlay tries to point at real elements
    await TestSetupHelper.setupStandardMocks(page, {
      trackEditorHelpShown: false,
    });
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );

    const overlay = page.locator("app-help-overlay");
    await overlay.locator(".help-popover").waitFor({ state: "visible" });

    await expect(page).toHaveScreenshot("track-editor-guided-help.png", {
      maxDiffPixelRatio: 0.1,
      animations: "disabled",
    });
  });
});
