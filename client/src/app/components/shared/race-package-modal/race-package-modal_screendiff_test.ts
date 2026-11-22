import { expect, Page, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { RacePackageModalHarnessE2e } from "./testing/race-package-modal.harness.e2e";

const SAMPLE_PACKAGE_PREVIEW = {
  manifest: {
    format_version: 1,
    created_by_app_version: "1.1.0",
    min_compatible_app_version: "1.0.0",
    package_type: "RACE_WITH_CONFIG",
    race_id: "pkg-race-1",
    race_name: "Grand Prix Championship",
    start_time: 1710000000000,
    end_time: 1710003600000,
    heat_count: 8,
    driver_count: 3,
    fingerprint: "abc123hash",
  },
  duplicate_race: true,
  existing_race_id: "existing-r1",
  existing_race_name: "Grand Prix Championship",
  config_conflict: true,
  existing_config_name: "Grand Prix Championship",
  suggested_config_name: "Grand Prix Championship (Copy)",
  driver_mappings: [
    {
      source_driver_id: "pkg-d1",
      source_driver_name: "Lewis Hamilton",
      source_driver_nickname: "LH44",
      matched_local_driver_id: "d1",
      matched_local_driver_name: "Lewis Hamilton",
      match_type: "EXACT_NAME",
      suggested_action: "LINK",
    },
    {
      source_driver_id: "pkg-d2",
      source_driver_name: "Max Verstappen",
      source_driver_nickname: "MV33",
      match_type: "NONE",
      suggested_action: "CREATE_NEW",
    },
    {
      source_driver_id: "t_redbull",
      source_driver_name: "Red Bull Racing",
      source_driver_nickname: "RBR",
      match_type: "NONE",
      suggested_action: "CREATE_NEW",
    },
  ],
  temp_package_token: "token-12345",
};

const ALL_MATCHED_PACKAGE_PREVIEW = {
  ...SAMPLE_PACKAGE_PREVIEW,
  duplicate_race: false,
  config_conflict: false,
  driver_mappings: [
    {
      source_driver_id: "pkg-d1",
      source_driver_name: "Lewis Hamilton",
      source_driver_nickname: "LH44",
      matched_local_driver_id: "d1",
      matched_local_driver_name: "Lewis Hamilton",
      match_type: "EXACT_NAME",
      suggested_action: "LINK",
    },
    {
      source_driver_id: "pkg-d2",
      source_driver_name: "Max Verstappen",
      source_driver_nickname: "MV33",
      matched_local_driver_id: "d2",
      matched_local_driver_name: "Max Verstappen",
      match_type: "EXACT_NAME",
      suggested_action: "LINK",
    },
  ],
};

async function openRaceHistoryDialog(page: Page) {
  const fileMenu = page.locator(".setup-menu-item").first();
  await expect(fileMenu).toBeVisible();
  await fileMenu.click();

  const historyMenuItem = page.locator(".setup-menu-dropdown-item").nth(1);
  await expect(historyMenuItem).toBeVisible();
  await historyMenuItem.click();

  const dialog = page.locator(
    "app-race-history-dialog .race-history-container",
  );
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".race-card").first()).toBeVisible();
  return dialog;
}

async function openRacePackageModal(
  page: Page,
  previewPayload: any = SAMPLE_PACKAGE_PREVIEW,
): Promise<RacePackageModalHarnessE2e> {
  await page.route("**/api/history/races/preview-package**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(previewPayload),
    });
  });

  const dialog = await openRaceHistoryDialog(page);
  const fileInput = dialog.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "sample_race.rcpack",
    mimeType: "application/zip",
    buffer: Buffer.from("dummy-rcpack-content"),
  });

  const modalHost = page.locator("app-race-package-modal");
  const harness = new RacePackageModalHarnessE2e(modalHost);
  await harness.waitForVisible(10000);
  await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
  await page.mouse.move(0, 0);
  await TestSetupHelper.disableAnimations(page);
  return harness;
}

test.describe("Race Package Modal Visuals", () => {
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

  test("should display race package modal step 1 with race details and configuration options", async ({
    page,
  }) => {
    const harness = await openRacePackageModal(page, SAMPLE_PACKAGE_PREVIEW);

    await expect(harness.dialog).toHaveScreenshot(
      "race-package-modal-step1.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });

  test("should display race package modal step 1 when duplicate action is set to skip", async ({
    page,
  }) => {
    const harness = await openRacePackageModal(page, SAMPLE_PACKAGE_PREVIEW);
    await harness.selectDuplicateAction("SKIP");
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(harness.dialog).toHaveScreenshot(
      "race-package-modal-step1-skip.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });

  test("should display race package modal step 2 with driver and team resolution table", async ({
    page,
  }) => {
    const harness = await openRacePackageModal(page, SAMPLE_PACKAGE_PREVIEW);
    await harness.goToStep(2);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(harness.dialog).toHaveScreenshot(
      "race-package-modal-step2.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });

  test("should display race package modal step 2 with all drivers matched summary", async ({
    page,
  }) => {
    const harness = await openRacePackageModal(
      page,
      ALL_MATCHED_PACKAGE_PREVIEW,
    );
    await harness.goToStep(2);
    await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);

    await expect(harness.dialog).toHaveScreenshot(
      "race-package-modal-step2-all-matched.png",
      {
        animations: "disabled",
        maxDiffPixelRatio: 0.05,
      },
    );
  });
});
