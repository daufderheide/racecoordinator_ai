import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Hardware Alert Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupRaceWebSocketMocks(page);
    await TestSetupHelper.setupAssetMocks(page);
    await TestSetupHelper.disableAnimations(page);
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.waitForLoadState("networkidle");
  });

  const setupRacedayWithAlert = async (page: any, occurrenceCount = 1) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/default-raceday"),
    );

    const raceData = {
      race: {
        race: {
          model: { entityId: "r1" },
          name: "Test Race",
          track: {
            model: { entityId: "t1" },
            name: "Test Track",
            lanes: [
              {
                objectId: "l1",
                backgroundColor: "#333333",
                foregroundColor: "#ffffff",
              },
            ],
          },
        },
        currentHeat: {
          objectId: "h1",
          heatNumber: 1,
          heatDrivers: [
            {
              objectId: "hd1",
              driver: {
                model: { entityId: "d1" },
                name: "Racer 1",
              },
              laneIndex: 0,
            },
          ],
        },
      },
    };

    await TestSetupHelper.mockRaceData(page, raceData);

    await TestSetupHelper.sendInterfaceAlert(page, {
      interfaceIndex: 0,
      interfaceName: "Arduino Uno (COM3)",
      alertType: 1, // AlertType.BROWNOUT_RESET
      severity: 1, // AlertSeverity.WARNING
      titleKey: "ALERT_BROWNOUT_TITLE",
      messageKey: "ALERT_BROWNOUT_MSG",
      details: "Microcontroller brownout detected",
      occurrenceCount,
      timestampMs: 1730000000000,
    });
  };

  test("should display hardware alert banner on raceday", async ({ page }) => {
    await setupRacedayWithAlert(page, 1);

    const banner = page.locator(".hardware-alert-banner");
    await banner.waitFor({ state: "visible" });

    await expect(banner).toHaveScreenshot("raceday-hardware-alert-banner.png", {
      mask: [banner.locator(".alert-summary")],
    });
  });

  test("should display hardware alert modal dialog with troubleshooting guide card", async ({
    page,
  }) => {
    await setupRacedayWithAlert(page, 2);

    const banner = page.locator(".hardware-alert-banner");
    await banner.waitFor({ state: "visible" });

    const detailsBtn = page.locator(
      "[data-testid='hardware-alert-details-btn']",
    );
    await detailsBtn.click();

    const modalCard = page.locator(".hardware-alert-modal-card");
    await modalCard.waitFor({ state: "visible" });

    await expect(modalCard).toHaveScreenshot(
      "raceday-hardware-alert-modal.png",
      {
        mask: [modalCard.locator(".stat-value").nth(2)],
      },
    );
  });

  test("should display hardware alert counter badge in raceday menu bar", async ({
    page,
  }) => {
    await setupRacedayWithAlert(page, 3);

    const dismissBtn = page.locator(
      "[data-testid='hardware-alert-dismiss-btn']",
    );
    await dismissBtn.waitFor({ state: "visible" });
    await dismissBtn.click();

    const badge = page.locator(
      "[data-testid='raceday-menu-hardware-alert-badge']",
    );
    await badge.waitFor({ state: "visible" });

    const menuBar = page.locator("app-raceday-menu-bar");
    await expect(menuBar).toHaveScreenshot(
      "raceday-menu-bar-hardware-alert-badge.png",
    );
  });
});
