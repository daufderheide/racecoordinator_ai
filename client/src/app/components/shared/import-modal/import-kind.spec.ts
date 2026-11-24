import { CarImportPreview } from "@app/models/car-import.model";

import {
  carDetails,
  carPictureName,
  carPreviewToDialog,
  carResultToDialog,
  dialogToCarCommit,
  IMPORT_KIND_CONFIG,
} from "./import-kind";

describe("import-kind (#1210, step 6b)", () => {
  const t = (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${Object.values(params).join("|")}` : key;

  const preview: CarImportPreview = {
    totalRows: 1,
    validCount: 1,
    conflictCount: 0,
    errorCount: 0,
    importedAssetNames: [],
    existingCars: [{ entityId: "7", name: "Audi" }],
    newFields: [],
    newOptions: [],
    rows: [
      {
        rowIndex: 1,
        rawName: "Mini",
        resolvedName: "Mini",
        values: { brand: "Scalextric", scale: "1/32" },
        customValues: { Weight: "72" },
        status: "VALID",
        conflictType: "NONE",
      },
    ],
  };

  it("keeps the driver texts as they were", () => {
    expect(IMPORT_KIND_CONFIG.drivers.importCountKey).toBe(
      "DIM_BTN_IMPORT_COUNT",
    );
    expect(IMPORT_KIND_CONFIG.drivers.templateName).toBe("drivers_template");
    expect(IMPORT_KIND_CONFIG.cars.templateName).toBe("cars_template");
  });

  it("gives a car row the name as nickname and lists cars as existing", () => {
    const dialog = carPreviewToDialog(preview, t);
    expect(dialog.rows[0].resolvedNickname).toBe("Mini");
    expect(dialog.rows[0].rawNickname).toBe("");
    expect(dialog.rows[0].selectedResolution).toBe("SKIP");
    expect(dialog.existingDrivers).toEqual([
      { entityId: "7", name: "Audi", nickname: "Audi" },
    ]);
    expect(carDetails(dialog.rows[0])).toBe("Scalextric · 1/32");
  });

  it("turns the dialog rows back into car rows with the user's choices", () => {
    const dialog = carPreviewToDialog(preview, t);
    dialog.rows[0].resolvedName = "Mini (1)";
    dialog.rows[0].selectedResolution = "AUTO_RENAME";
    const request = dialogToCarCommit(dialog.rows, {
      newFields: [{ name: "Weight", type: "text", options: [] }],
      newOptions: [],
    });
    expect(request.rows[0].resolvedName).toBe("Mini (1)");
    expect(request.rows[0].selectedResolution).toBe("AUTO_RENAME");
    expect(request.rows[0].customValues).toEqual({ Weight: "72" });
    expect((request.rows[0] as any).resolvedNickname).toBeUndefined();
    expect(request.newFields.length).toBe(1);
    expect(dialogToCarCommit(dialog.rows, null).newFields).toEqual([]);
  });

  it("maps the car result to the dialog's result", () => {
    const r = carResultToDialog({
      success: true,
      importedCount: 2,
      updatedCount: 0,
      skippedCount: 1,
      createdCarIds: ["1", "2"],
      updatedCarIds: [],
      createdFieldNames: [],
      messages: [],
    });
    expect(r.createdDriverIds).toEqual(["1", "2"]);
    expect(r.skippedCount).toBe(1);
  });

  it("shows a saved picture by its file name", () => {
    expect(
      carPictureName("/assets/1cb5cdda-58ff-4f11-8536-fa008b9603c6_audi.png"),
    ).toBe("audi.png");
    expect(carPictureName("images/mini.png")).toBe("mini.png");
    expect(carPictureName(undefined)).toBe("");
  });
});
