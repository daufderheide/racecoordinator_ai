import { expect, Page, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

async function openDisallowDialog(page: Page) {
  const fileMenu = page.locator(".setup-menu-item").filter({ hasText: "File" });
  await expect(fileMenu).toBeVisible();
  await fileMenu.click();

  const historyMenuItem = page
    .locator(".setup-menu-dropdown-item")
    .filter({ hasText: "Race History" });
  await expect(historyMenuItem).toBeVisible();
  await historyMenuItem.click();

  const historyDialog = page.locator(
    "app-race-history-dialog .race-history-container",
  );
  await expect(historyDialog).toBeVisible();

  // Click 'Manage Lap Records' on Daytona (which has ineligible laps in mockFinishedRaceHistory)
  const editButton = historyDialog
    .locator(".race-card")
    .filter({ hasText: "Daytona" })
    .locator(".btn-edit-laps");
  await expect(editButton).toBeVisible();
  await editButton.click();

  const disallowDialog = page.locator(
    "app-disallow-lap-records-dialog .disallow-records-container",
  );
  await expect(disallowDialog).toBeVisible();
  await expect(disallowDialog.locator(".dlr-table-row").first()).toBeVisible();
  return disallowDialog;
}

test.describe("Disallow Lap Records Dialog Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, {
      skipIntro: true,
      walkthroughSeen: true,
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/raceday-setup"),
    );
    await TestSetupHelper.disableAnimations(page);
    await expect(page.locator(".setup-container")).toBeVisible({
      timeout: 15000,
    });
  });

  test("should display disallow lap records dialog", async ({ page }) => {
    const dialog = await openDisallowDialog(page);

    await expect(dialog).toHaveScreenshot("disallow-lap-records-dialog.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
    });
  });

  test("should display disallow lap records dialog sorted by status", async ({
    page,
  }) => {
    const dialog = await openDisallowDialog(page);

    const statusHeader = dialog.locator(".col-status.sortable-header");
    await expect(statusHeader).toBeVisible();
    await statusHeader.click();

    await expect(dialog).toHaveScreenshot(
      "disallow-lap-records-dialog-sorted-status.png",
      {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
      },
    );
  });
});

test.describe("Disallow Lap Records Dialog Visuals - Australian Locale", () => {
  test.use({ locale: "en-AU" });

  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, {
      skipIntro: true,
      walkthroughSeen: true,
    });

    await page.setViewportSize({ width: 1280, height: 800 });
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/raceday-setup"),
    );
    await TestSetupHelper.disableAnimations(page);
    await expect(page.locator(".setup-container")).toBeVisible({
      timeout: 15000,
    });
  });

  test("should display disallow lap records dialog with Australian date format", async ({
    page,
  }) => {
    const dialog = await openDisallowDialog(page);

    await expect(dialog).toHaveScreenshot(
      "disallow-lap-records-dialog-en-au.png",
      {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
      },
    );
  });
});
