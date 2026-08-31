import { expect, Page, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { AboutDialogHarnessE2e } from "./testing/about-dialog.harness.e2e";

test.describe("About Dialog", () => {
  test.beforeEach(async ({ page }) => {
    // 1. Setup standard mocks
    await TestSetupHelper.setupStandardMocks(page, {
      skipIntro: true,
      walkthroughSeen: true,
    });

    // 2. Force fixed viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    // 3. Navigate
    await page.goto("/");

    // 4. Disable animations for stability (except we control credits animation explicitly)
    await TestSetupHelper.disableAnimations(page);

    // 5. Wait for UI to render
    await expect(page.locator(".setup-menu-item").first()).toBeVisible({
      timeout: 10000,
    });

    // 6. Extra stabilization wait
    await page.waitForTimeout(100);
  });

  async function openAboutDialog(page: Page): Promise<AboutDialogHarnessE2e> {
    // 1. Open Help Menu
    const helpMenu = page.locator(".help-menu-container .setup-menu-item");
    await expect(helpMenu).toBeVisible();
    await helpMenu.dispatchEvent("click");

    // 2. Click About
    const dropdown = page.locator(".help-menu-container .setup-menu-dropdown");
    await expect(dropdown).toBeVisible();

    const aboutItem = dropdown.locator(".setup-menu-dropdown-item").last();
    await expect(aboutItem).toBeVisible();
    await aboutItem.dispatchEvent("click");

    // 3. Verify dialog is visible
    const dialogHost = page.locator("app-about-dialog");
    const harness = new AboutDialogHarnessE2e(dialogHost);

    await expect(async () => {
      expect(await harness.isVisible()).toBe(true);
    }).toPass();

    return harness;
  }

  test("should display info tab on open", async ({ page }) => {
    await openAboutDialog(page);

    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("about-dialog.png", {
      mask: [page.locator(".quote-container"), page.locator(".spinner")],
      maxDiffPixelRatio: 0.1,
      threshold: 0.2,
      animations: "disabled",
    });
  });

  test("should display charity and mission tab", async ({ page }) => {
    const harness = await openAboutDialog(page);

    await harness.clickTab(1);
    await expect(async () => {
      expect(await harness.isCharityTabVisible()).toBe(true);
    }).toPass();

    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("about-dialog-charity-tab.png", {
      mask: [page.locator(".quote-container"), page.locator(".spinner")],
      maxDiffPixelRatio: 0.1,
      threshold: 0.2,
      animations: "disabled",
    });
  });

  test("should display credits tab", async ({ page }) => {
    const harness = await openAboutDialog(page);

    await harness.clickTab(2);
    await expect(async () => {
      expect(await harness.isCreditsTabVisible()).toBe(true);
    }).toPass();

    // Freeze animation and offset transform so credit names are visible in viewport
    await page.evaluate(() => {
      const anims = document.getAnimations();
      anims.forEach((anim) => anim.pause());
      const el = document.querySelector(".credits-content") as HTMLElement;
      if (el) {
        el.style.animation = "none";
        el.style.transform = "translateY(-280px)";
      }
    });

    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot("about-dialog-credits-tab.png", {
      mask: [page.locator(".quote-container"), page.locator(".spinner")],
      maxDiffPixelRatio: 0.1,
      threshold: 0.2,
      animations: "disabled",
    });
  });
});
