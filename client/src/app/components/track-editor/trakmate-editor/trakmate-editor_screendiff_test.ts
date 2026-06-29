import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

test.describe("Trakmate Editor Component Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.disableAnimations(page);

    await page.route("**/api/tracks", async (route) => {
      const tracks = [
        {
          entity_id: "t1",
          name: "Test Track",
          lanes: [
            {
              entity_id: "l1",
              length: 10,
              backgroundColor: "#fff",
              foregroundColor: "#000",
            },
            {
              entity_id: "l2",
              length: 10,
              backgroundColor: "#ff0000",
              foregroundColor: "#ffffff",
            },
          ],
          trackmate_configs: [
            {
              name: "Trakmate 1",
              commPort: "COM2",
              debounce: 2,
              normallyClosedRelays: true,
              useIr: false,
              numLanes: 2,
              normallyClosedLaneSensors: false,
              hasPerLaneRelays: true,
              lapPinPitBehavior: 3, // pit in out
              lapPinBehaviors: [1000, 1001, 1000, 1000, 1000, 1000, 1000, 1000],
            },
          ],
        },
      ];

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tracks),
      });
    });
  });

  test("should display trakmate editor with main config and pins", async ({
    page,
  }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );

    const editor = page.locator("app-trakmate-editor");
    await expect(editor).toBeVisible();

    // Ensure the image loads properly
    const boardImg = editor.locator(".trakmate-logo");
    if ((await boardImg.count()) > 0) {
      await boardImg.evaluate((img: any) => {
        return new Promise((resolve) => {
          if (img.complete) {
            resolve(true);
          } else {
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
          }
        });
      });
    }

    await expect(editor).toHaveScreenshot("trakmate-editor-all-opened.png", {
      maxDiffPixels: 200,
      threshold: 0.2,
    });
  });

  test("should toggle sections correctly", async ({ page }) => {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/track-editor?id=t1"),
    );

    const editor = page.locator("app-trakmate-editor");
    await expect(editor).toBeVisible();

    // click on the main config header
    const mainHeader = editor.locator(".section-header").nth(0);
    await mainHeader.click();
    await page.waitForTimeout(600);

    await expect(editor).toHaveScreenshot(
      "trakmate-editor-main-collapsed.png",
      {
        maxDiffPixelRatio: 0.05,
      },
    );
  });
});
