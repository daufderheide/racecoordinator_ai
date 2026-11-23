import { expect, Page, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

/**
 * Visuals of the one-screen race import dialog (#972), opened from Race
 * History with a mocked package preview. Local drivers come from the standard
 * mocks: Alice (d1), Bob (d2), Charlie (d3), Dave (d4).
 */

const manifest = {
  format_version: 1,
  created_by_app_version: "1.1.0",
  min_compatible_app_version: "1.0.0",
  package_type: "race_package",
  race_id: "src-race-1",
  race_name: "Thursday Night Sprint",
  start_time: 1795705935475,
  end_time: 1795705935475,
  heat_count: 4,
  driver_count: 4,
  fingerprint: "fp-1",
};

const NEW_RACE_PREVIEW = {
  manifest,
  duplicate_race: false,
  config_conflict: false,
  temp_package_token: "token-new",
  driver_mappings: [
    {
      source_driver_id: "s1",
      source_driver_name: "Alice",
      source_driver_nickname: "The Rocket",
      matched_local_driver_id: "d1",
      match_type: "EXACT_NAME",
      suggested_action: "LINK",
    },
    {
      source_driver_id: "s2",
      source_driver_name: "Bobby B.",
      source_driver_nickname: "Drift King",
      matched_local_driver_id: "d2",
      match_type: "EXACT_NICKNAME",
      suggested_action: "LINK",
    },
    {
      source_driver_id: "s3",
      source_driver_name: "Mick",
      source_driver_nickname: "Lead Foot",
      match_type: "NONE",
      suggested_action: "CREATE_NEW",
    },
    {
      source_driver_id: "s4",
      source_driver_name: "Shelby",
      source_driver_nickname: "Cobra",
      match_type: "NONE",
      suggested_action: "CREATE_NEW",
    },
  ],
};

const SAME_RACE_PREVIEW = {
  manifest: { ...manifest, race_name: "Grand Prix" },
  duplicate_race: true,
  existing_race_id: "h1",
  existing_race_name: "Grand Prix",
  config_conflict: true,
  existing_config_name: "Grand Prix",
  suggested_config_name: "Grand Prix (1)",
  temp_package_token: "token-same",
  driver_mappings: [
    ["s1", "Alice", "The Rocket", "d1"],
    ["s2", "Bob", "Drift King", "d2"],
    ["s3", "Charlie", "Speedy", "d3"],
    ["s4", "Dave", "Noob", "d4"],
  ].map(([id, name, nick, local]) => ({
    source_driver_id: id,
    source_driver_name: name,
    source_driver_nickname: nick,
    matched_local_driver_id: local,
    match_type: "EXACT_NAME",
    suggested_action: "LINK",
  })),
};

async function openImportDialog(page: Page, preview: object) {
  await page.route("**/api/history/races/preview-package", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(preview),
    }),
  );

  await page.locator(".setup-menu-item").first().click();
  await page.locator(".setup-menu-dropdown-item").nth(1).click();
  const history = page.locator(
    "app-race-history-dialog .race-history-container",
  );
  await expect(history).toBeVisible();

  await history.locator('input[type="file"]').setInputFiles({
    name: "race.rcpack",
    mimeType: "application/zip",
    buffer: Buffer.from("PK"),
  });

  const dialog = page.locator(".rpm-dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}

test.describe("Race Package Import Dialog Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, {
      skipIntro: true,
      walkthroughSeen: true,
    });
    await page.setViewportSize({ width: 1280, height: 900 });
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

  test("should show a race from another club with new drivers", async ({
    page,
  }) => {
    const dialog = await openImportDialog(page, NEW_RACE_PREVIEW);
    await expect(dialog.locator(".rpm-driver-row")).toHaveCount(4);

    await expect(dialog).toHaveScreenshot("race-package-modal-new-race.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
    });
  });

  test("should grey out local drivers that are already used", async ({
    page,
  }) => {
    const dialog = await openImportDialog(page, NEW_RACE_PREVIEW);
    await dialog
      .locator(".rpm-driver-row", { hasText: "Mick" })
      .locator(".custom-select-trigger")
      .click();
    const alice = page
      .locator(".custom-select-option", { hasText: "Alice" })
      .first();
    await expect(alice).toHaveClass(/disabled/);

    await expect(page).toHaveScreenshot(
      "race-package-modal-driver-picker.png",
      { maxDiffPixelRatio: 0.05, animations: "disabled" },
    );
  });

  test("should show the same race again with a race format name clash", async ({
    page,
  }) => {
    const dialog = await openImportDialog(page, SAME_RACE_PREVIEW);
    await expect(dialog.locator(".rpm-duplicate-callout")).toBeVisible();
    await expect(dialog.locator(".rpm-driver-row")).toHaveCount(0);

    await expect(dialog).toHaveScreenshot("race-package-modal-same-race.png", {
      maxDiffPixelRatio: 0.05,
      animations: "disabled",
    });
  });
});
