import { expect, test } from "@playwright/test";
import { DefaultRacedaySetupHarnessE2e } from "@app/components/raceday-setup/testing/default-raceday-setup.harness.e2e";
import { TestSetupHelper } from "@app/testing/test-setup_helper";

import { CarEditorHarnessE2e } from "./testing/car-editor.harness.e2e";

test.describe("Slotcar Editor Visuals", () => {
  test.beforeEach(async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page, { cars: true });
    await page.setViewportSize({ width: 1600, height: 900 });
    await TestSetupHelper.disableAnimations(page);
  });

  async function open(page: any, id: string) {
    await TestSetupHelper.waitForLocalization(
      page,
      "en",
      page.goto(`/car-editor?id=${id}`),
    );
    await page.locator(".page-container").waitFor();
    await page.locator(".loader-overlay").waitFor({ state: "hidden" });
  }

  async function enterEditMode(page: any) {
    await page.locator("#edit-track-btn").click();
    await expect(page.locator("#car-name-input")).toBeEnabled();
  }

  async function settle(page: any) {
    await TestSetupHelper.blurActiveElement(page);
    await page.mouse.move(0, 0);
    await TestSetupHelper.disableAnimations(page);
  }

  test("shows a car read-only", async ({ page }) => {
    await open(page, "c1");
    await settle(page);

    await expect(page).toHaveScreenshot("car-editor-read-only.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("shows a car in edit mode", async ({ page }) => {
    await open(page, "c1");
    await enterEditMode(page);
    await settle(page);

    await expect(page).toHaveScreenshot("car-editor-edit-mode.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("shows a stock car in another scale", async ({ page }) => {
    await open(page, "c2");
    await settle(page);

    await expect(page).toHaveScreenshot("car-editor-stock-car.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("marks a name another car has", async ({ page }) => {
    await open(page, "c1");
    await enterEditMode(page);
    const harness = new CarEditorHarnessE2e(page.locator(".page-container"));
    await harness.setName("Audi R8 LMS");
    await settle(page);

    await expect(page).toHaveScreenshot("car-editor-name-taken.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("shows a new car with example placeholders", async ({ page }) => {
    await open(page, "c1");
    await page.locator("#add-item-btn").click();
    await expect(page.locator("#car-name-input")).toHaveValue("New Slotcar");
    await settle(page);

    await expect(page).toHaveScreenshot("car-editor-new-car.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("opens the export dialog for the cars", async ({ page }) => {
    await open(page, "c1");
    await page.locator("#export-btn").click();
    const dialog = page.locator("#car-export-modal-dialog");
    await dialog.waitFor({ state: "visible" });
    await settle(page);

    await expect(dialog).toHaveScreenshot("car-export-dialog.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("opens the import dialog for the cars", async ({ page }) => {
    await open(page, "c1");
    await page.locator("#import-btn").click();
    const dialog = page.locator("#import-modal-dialog");
    await dialog.waitFor({ state: "visible" });
    await settle(page);

    await expect(dialog).toHaveScreenshot("car-import-upload.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });

  test("previews a car import with a conflict and new fields", async ({
    page,
  }) => {
    await page.route("**/api/cars/import/preview", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          totalRows: 3,
          validCount: 2,
          conflictCount: 1,
          errorCount: 0,
          importedAssetNames: [],
          existingCars: [{ entityId: "c3", name: "Audi R8 LMS" }],
          newFields: [{ name: "Club number", type: "text", options: [] }],
          newOptions: [
            { name: "Tyre compound", type: "choice", options: ["Super soft"] },
          ],
          rows: [
            {
              rowIndex: 1,
              rawName: "Ferrari 330 P4",
              resolvedName: "Ferrari 330 P4",
              values: { brand: "Slot.it", carClass: "Classic", scale: "1/32" },
              customValues: { "Club number": "12" },
              status: "VALID",
              conflictType: "NONE",
            },
            {
              rowIndex: 2,
              rawName: "Audi R8 LMS",
              resolvedName: "Audi R8 LMS",
              values: { brand: "Scalextric", carClass: "GT3", scale: "1/32" },
              customValues: {},
              status: "CONFLICT",
              conflictType: "DUPLICATE_NAME",
              selectedResolution: "SKIP",
              existingCarId: "c3",
            },
            {
              rowIndex: 3,
              rawName: "Mini Cooper S",
              resolvedName: "Mini Cooper S",
              values: { brand: "Scalextric", carClass: "Touring" },
              customValues: { "Tyre compound": "Super soft" },
              status: "VALID",
              conflictType: "NONE",
              message: "Picture not found: images/mini.png",
            },
          ],
        }),
      }),
    );
    await open(page, "c1");
    await page.locator("#import-btn").click();
    const dialog = page.locator("#import-modal-dialog");
    await dialog.waitFor({ state: "visible" });
    await dialog.locator("input[type=file]").setInputFiles({
      name: "cars.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("Name\nFerrari 330 P4\n"),
    });
    await page.locator("#btn-validate-preview").click();
    await page.locator("#import-preview-step").waitFor();
    await settle(page);

    await expect(dialog).toHaveScreenshot("car-import-preview.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });
});

test.describe("Slotcars in the Manage menu", () => {
  test.use({ locale: "en" });

  test("lists Slotcars under Drivers and Teams", async ({ page }) => {
    await TestSetupHelper.setupStandardMocks(page);
    await TestSetupHelper.setupLocalStorage(page, {
      selectedDriverIds: ["d1", "d2"],
      racedaySetupWalkthroughSeen: true,
      language: "en",
    });
    await page.setViewportSize({ width: 1280, height: 720 });
    await TestSetupHelper.waitForLocalization(page, "en", page.goto("/"));
    const container = page.locator(".setup-container");
    await container.waitFor({ state: "visible", timeout: 15000 });
    await page.getByText("Alice").first().waitFor();
    await TestSetupHelper.disableAnimations(page);

    await new DefaultRacedaySetupHarnessE2e(container).openConfigMenu();
    await page.locator("#setup-menu-slotcars").waitFor();
    await page.mouse.move(0, 0);

    await expect(page).toHaveScreenshot("car-editor-manage-menu.png", {
      animations: "disabled",
      maxDiffPixelRatio: 0.05,
    });
  });
});
