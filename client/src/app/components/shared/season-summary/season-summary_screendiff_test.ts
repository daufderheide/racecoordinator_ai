import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { SeasonSummaryHarnessBase } from "./testing/season-summary.harness.base";

test.describe("Season Summary Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await page.setViewportSize({ width: 1600, height: 900 });
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.disableAnimations(page);
  });

  test("should display season summary with no races run in season", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/season-manager?id=s_empty"),
    );

    const summaryHost = page.locator(SeasonSummaryHarnessBase.hostSelector);
    await summaryHost.waitFor();

    await TestSetupHelper.disableAnimations(page);
    await page.waitForTimeout(200);

    await expect(summaryHost).toHaveScreenshot("season-summary-no-races.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("should display season summary with standings and demo badge", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/season-manager?id=s_active"),
    );

    const summaryHost = page.locator(SeasonSummaryHarnessBase.hostSelector);
    await summaryHost.waitFor();

    await TestSetupHelper.disableAnimations(page);
    await page.waitForTimeout(200);

    await expect(summaryHost).toHaveScreenshot("season-summary-races-run.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });
});
