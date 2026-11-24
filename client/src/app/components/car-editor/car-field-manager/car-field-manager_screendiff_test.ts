import { expect, test } from "@playwright/test";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { CarFieldManagerHarnessE2e } from "./testing/car-field-manager.harness.e2e";

test.describe("Slotcar field manager visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, { cars: true });
    await page.setViewportSize({ width: 1600, height: 900 });
    await TestSetupHelper.disableAnimations(page);
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto("/car-editor?id=c1"),
    );
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });
    await page.locator("#edit-track-btn").click();
    await page.locator("#car-manage-fields-btn").click();
    await page.locator("#car-field-modal-dialog").waitFor();
  });

  async function settle(page: any) {
    await TestSetupHelper.blurActiveElement(page);
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);
  }

  test("lists the fields", async ({ page }) => {
    await settle(page);
    await expect(page.locator("#car-field-modal-dialog")).toHaveScreenshot(
      "car-field-manager-list.png",
      { animations: "disabled" },
    );
  });

  test("adds a choice field", async ({ page }) => {
    const harness = new CarFieldManagerHarnessE2e(
      page.locator("app-car-field-manager"),
    );
    await harness.clickNewField();
    await harness.setName("Motor brand");
    await page.locator("#car-field-type-select").click();
    await page
      .locator(".custom-select-option")
      .filter({ hasText: "Choice from a list" })
      .click();
    await harness.setChoices("Slot.it\nNSR\nScaleauto");
    await settle(page);

    await expect(page.locator("#car-field-modal-dialog")).toHaveScreenshot(
      "car-field-manager-new-choice.png",
      { animations: "disabled" },
    );
  });

  test("asks before deleting a field", async ({ page }) => {
    await page
      .locator("#car-field-row-f-pinion .btn-ghost-action.delete")
      .click();
    await settle(page);

    await expect(page.locator("#car-field-modal-dialog")).toHaveScreenshot(
      "car-field-manager-delete.png",
      { animations: "disabled" },
    );
  });
});
