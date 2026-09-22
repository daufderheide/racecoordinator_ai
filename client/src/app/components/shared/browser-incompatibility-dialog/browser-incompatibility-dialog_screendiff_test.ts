import { expect, test } from "@playwright/test";

import { BrowserIncompatibilityDialogHarnessE2e } from "./testing/browser-incompatibility-dialog.harness.e2e";

test.describe("Browser Incompatibility Dialog Visuals", () => {
  test("should display browser incompatibility overlay when browser features are unsupported", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.addInitScript(() => {
      delete (window as any).CSS;
    });
    await page.goto("/");

    const overlay = page.locator(
      BrowserIncompatibilityDialogHarnessE2e.hostSelector,
    );
    const harness = new BrowserIncompatibilityDialogHarnessE2e(overlay);
    await harness.waitForVisible(10000);

    await expect(overlay).toHaveScreenshot(
      "browser-incompatibility-overlay.png",
      {
        animations: "disabled",
      },
    );
  });

  test("should display browser incompatibility dialog card with requirements", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.addInitScript(() => {
      delete (window as any).CSS;
    });
    await page.goto("/");

    const overlay = page.locator(
      BrowserIncompatibilityDialogHarnessE2e.hostSelector,
    );
    const harness = new BrowserIncompatibilityDialogHarnessE2e(overlay);
    await harness.waitForVisible(10000);

    await expect(harness.card).toHaveScreenshot(
      "browser-incompatibility-card.png",
      {
        animations: "disabled",
      },
    );
  });

  test("should display localized browser incompatibility dialog in German", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.addInitScript(() => {
      delete (window as any).CSS;
      Object.defineProperty(navigator, "language", {
        value: "de-DE",
        configurable: true,
      });
    });
    await page.goto("/");

    const overlay = page.locator(
      BrowserIncompatibilityDialogHarnessE2e.hostSelector,
    );
    const harness = new BrowserIncompatibilityDialogHarnessE2e(overlay);
    await harness.waitForVisible(10000);

    await expect(harness.card).toHaveScreenshot(
      "browser-incompatibility-card-de.png",
      {
        animations: "disabled",
      },
    );
  });
});

test.describe("Browser Incompatibility - JavaScript Disabled", () => {
  test.use({ javaScriptEnabled: false });

  test("should display JavaScript required dialog when JavaScript is disabled", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");

    const overlay = page.locator(
      BrowserIncompatibilityDialogHarnessE2e.hostSelector,
    );
    const harness = new BrowserIncompatibilityDialogHarnessE2e(overlay);
    await harness.waitForVisible(10000);

    await expect(harness.card).toHaveScreenshot(
      "browser-incompatibility-card-noscript.png",
      {
        animations: "disabled",
      },
    );
  });
});
