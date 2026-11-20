import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";

import {
  buildLayoutExport,
  executeClearFolder,
  executeClearWidgetFolder,
  executeSelectFolder,
  executeSelectWidgetFolder,
  executeTemplateFileSelected,
  formatImportErrorMessage,
  getDefaultLayoutResetData,
  parseLayoutImport,
  parseLayoutImportDetailed,
} from "./ui-editor-io.helper";

describe("ui-editor-io.helper", () => {
  it("should get default layout reset data for raceday, practice, fuel, and driver station", () => {
    const racedayData = getDefaultLayoutResetData(false, 1920, 1080);
    expect(racedayData.columns).toEqual(Settings.DEFAULT_COLUMNS);

    const practiceData = getDefaultLayoutResetData(true, 1920, 1080);
    expect(practiceData.columns).toEqual(Settings.DEFAULT_PRACTICE_COLUMNS);

    const fuelData = getDefaultLayoutResetData(false, 1920, 1080, false, true);
    expect(fuelData.columns).toContain("imageset_fuel-gauge-builtin");

    for (const [layout, template] of [
      [racedayData.defaultLayout, Settings.DEFAULT_LAYOUT],
      [practiceData.defaultLayout, Settings.DEFAULT_PRACTICE_LAYOUT],
      [fuelData.defaultLayout, Settings.DEFAULT_FUEL_LAYOUT],
    ]) {
      expect(layout.widgets).not.toBe(template.widgets);
      expect(layout.widgets.map((w) => w.id)).toEqual(
        template.widgets.map((w) => w.id),
      );
      expect(
        layout.widgets.some((w) => w.widgetType === "lane-view"),
      ).toBeFalse();
      expect(
        layout.widgets.some(
          (w) => w.widgetType === "lane-column" && w.customSettings?.["gridId"],
        ),
      ).toBeTrue();
    }

    const dsData = getDefaultLayoutResetData(false, 1080, 1920, true);
    expect(dsData.defaultLayout).toBeDefined();
    expect(dsData.columns).toEqual([]);
  });

  it("should build layout export data and filename", () => {
    const ui: CustomUI = {
      _id: "custom_1",
      entity_id: "custom_1",
      name: "My Custom UI",
      is_default: false,
      layoutJson: JSON.stringify({
        baseWidth: 1920,
        baseHeight: 1080,
        widgets: [],
      }),
      columnsJson: JSON.stringify(["lapCount"]),
    };

    const res = buildLayoutExport(ui, new Settings());
    expect(res.fileName).toBe("my-custom-ui-layout.json");
    expect(res.layoutExport.layout.baseWidth).toBe(1920);
    expect(res.layoutExport.columns).toEqual(["lapCount"]);
  });

  it("should parse full export layout JSON", () => {
    const exportJson = JSON.stringify({
      layout: { baseWidth: 1920, baseHeight: 1080, widgets: [] },
      columns: ["lapCount", "lastLapTime"],
      columnLayouts: {},
      columnVisibility: {},
      columnAnchors: {},
      columnWidths: { lapCount: 200 },
    });

    const parsed = parseLayoutImport(exportJson, false);
    expect(parsed).not.toBeNull();
    expect(parsed?.layout.baseWidth).toBe(1920);
    expect(parsed?.columns).toEqual(["lapCount", "lastLapTime"]);
    expect(parsed?.columnWidths).toEqual({ lapCount: 200 });
  });

  it("preserves native gap columns and insets alongside a modular gap widget", () => {
    const columns = ["gapLeader", "gapPositionF1"];
    const columnWidths = { gapLeader: 110, gapPositionF1: 245 };
    const columnLayouts = {
      gapLeader: {
        "center-center": "gapLeader",
        "top-right": "overallGapPositionF1",
      },
      gapPositionF1: {
        "center-center": "gapPositionF1",
        "top-right": "gapLeader",
      },
    };
    const nativeSettings = {
      highlightLapStyle: "classic",
      insets: { "top-right": "gapPositionF1" },
      insetsConfig: { "top-right": { columnKey: "gapPositionF1" } },
    };
    const raw = {
      layout: {
        widgets: [
          {
            id: "table",
            widgetType: "lane-view",
            customSettings: nativeSettings,
          },
          {
            id: "card",
            widgetType: "lane-column",
            customSettings: { columnKey: "gapPositionF1" },
          },
        ],
      },
      columns,
      columnWidths,
      columnLayouts,
      columnAnchors: { gapPositionF1: "top-right" },
    };
    const result = parseLayoutImportDetailed(JSON.stringify(raw), false);
    expect(result.success).toBeTrue();
    expect(result.data?.columns).toEqual(columns);
    expect(result.data?.columnWidths).toEqual(columnWidths);
    expect(result.data?.columnLayouts).toEqual(columnLayouts);
    expect(result.data?.columnAnchors).toEqual(raw.columnAnchors);
    expect(result.data?.layout.widgets[0].customSettings).toEqual(
      nativeSettings,
    );
    expect(result.data?.layout.widgets[1].customSettings).toEqual(
      jasmine.objectContaining({
        columnKey: "gap",
        gapTarget: "position",
        gapMode: "laps_and_time",
      }),
    );
  });

  it("should parse plain LayoutConfig JSON as fallback", () => {
    const layoutOnlyJson = JSON.stringify({
      baseWidth: 1600,
      baseHeight: 900,
      widgets: [
        {
          id: "w1",
          widgetType: "lane-view",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          zIndex: 1,
        },
      ],
    });

    const parsed = parseLayoutImport(layoutOnlyJson, false);
    expect(parsed).not.toBeNull();
    expect(parsed?.layout.baseWidth).toBe(1600);
    expect(parsed?.layout.widgets).toEqual([
      jasmine.objectContaining(JSON.parse(layoutOnlyJson).widgets[0]),
    ]);
    expect(parsed?.columns).toBeDefined();
  });

  it("should return null for invalid JSON", () => {
    const parsed = parseLayoutImport("invalid-json{", false);
    expect(parsed).toBeNull();
  });

  it("should parse CustomUI entity layout JSON with stringified layoutJson and columnsJson", () => {
    const customUiJson = JSON.stringify({
      name: "Modern RC AI — Four Rows",
      entity_id: "rcai-modern-four-rows-layout",
      is_default: false,
      layoutJson: JSON.stringify({
        baseWidth: 1920,
        baseHeight: 1080,
        scaleMode: "letterbox",
        widgets: [
          {
            id: "w-lane-0",
            widgetType: "lane-column",
            x: 24,
            y: 180,
            width: 446,
            height: 160,
            zIndex: 10,
            customSettings: { columnKey: "driver.nickname", targetIndex: 0 },
          },
        ],
      }),
      columnsJson: "[]",
      columnLayoutsJson: "{}",
      columnVisibilityJson: "{}",
      columnWidthsJson: "{}",
      columnAnchorsJson: "{}",
    });

    const detailed = parseLayoutImportDetailed(customUiJson, false);
    expect(detailed.success).toBeTrue();
    expect(detailed.data).toBeDefined();
    expect(detailed.data?.layout.baseWidth).toBe(1920);
    expect(detailed.data?.layout.widgets.length).toBe(1);
    expect(detailed.data?.columns).toEqual([]);

    const compat = parseLayoutImport(customUiJson, false);
    expect(compat).not.toBeNull();
    expect(compat?.layout.widgets[0].id).toBe("w-lane-0");
  });

  it("should report UE_ERROR_IMPORT_INVALID_JSON for malformed JSON or empty string", () => {
    const res1 = parseLayoutImportDetailed("not-json", false);
    expect(res1.success).toBeFalse();
    expect(res1.errorKey).toBe("UE_ERROR_IMPORT_INVALID_JSON");
    expect(res1.errorDetail).toBeDefined();

    const res2 = parseLayoutImportDetailed("", false);
    expect(res2.success).toBeFalse();
    expect(res2.errorKey).toBe("UE_ERROR_IMPORT_INVALID_JSON");
    expect(res2.reasonKey).toBe("UE_ERROR_IMPORT_REASON_EMPTY");
  });

  it("should report UE_ERROR_IMPORT_NO_LAYOUT when JSON has no layout configuration", () => {
    const noLayoutJson = JSON.stringify({
      foo: "bar",
      someNumber: 42,
    });
    const res = parseLayoutImportDetailed(noLayoutJson, false);
    expect(res.success).toBeFalse();
    expect(res.errorKey).toBe("UE_ERROR_IMPORT_NO_LAYOUT");
    expect(res.reasonKey).toBe("UE_ERROR_IMPORT_REASON_MISSING_LAYOUT");
  });

  it("should report UE_ERROR_IMPORT_NO_LAYOUT when root is not a JSON object", () => {
    const arrayJson = JSON.stringify([1, 2, 3]);
    const res = parseLayoutImportDetailed(arrayJson, false);
    expect(res.success).toBeFalse();
    expect(res.errorKey).toBe("UE_ERROR_IMPORT_NO_LAYOUT");
    expect(res.reasonKey).toBe("UE_ERROR_IMPORT_REASON_NOT_OBJECT");
  });

  it("should report invalid layout reason when layout is not valid object", () => {
    const badLayoutJson = JSON.stringify({
      layout: "not-an-object",
    });
    const res = parseLayoutImportDetailed(badLayoutJson, false);
    expect(res.success).toBeFalse();
    expect(res.errorKey).toBe("UE_ERROR_IMPORT_NO_LAYOUT");
    expect(res.reasonKey).toBe("UE_ERROR_IMPORT_REASON_INVALID_LAYOUT");
  });

  it("should report invalid widgets reason when widgets is not an array", () => {
    const badWidgetsJson = JSON.stringify({
      layout: {
        widgets: "not-an-array",
      },
    });
    const res = parseLayoutImportDetailed(badWidgetsJson, false);
    expect(res.success).toBeFalse();
    expect(res.errorKey).toBe("UE_ERROR_IMPORT_NO_LAYOUT");
    expect(res.reasonKey).toBe("UE_ERROR_IMPORT_REASON_INVALID_WIDGETS");
  });

  it("should successfully import layout wrapped in layoutExport property (such as Fixed_Distance_layout.json)", () => {
    const wrappedExport = JSON.stringify({
      layoutExport: {
        layout: {
          baseWidth: 1920,
          baseHeight: 1080,
          widgets: [
            {
              id: "w-menu",
              widgetType: "menu-bar",
              x: 0,
              y: 0,
              width: 1920,
              height: 50,
            },
          ],
        },
        columns: ["driver.nickname", "lapCount"],
        columnLayouts: { lapCount: { width: 100 } },
        columnVisibility: { lapCount: true },
        columnAnchors: {},
        columnWidths: { lapCount: 100 },
      },
      fileName: "Fixed_Distance_layout.json",
    });

    const res = parseLayoutImportDetailed(wrappedExport, false);
    expect(res.success).toBeTrue();
    expect(res.data).toBeDefined();
    expect(res.data?.layout.baseWidth).toBe(1920);
    expect(res.data?.layout.widgets.length).toBe(1);
    expect(res.data?.columns).toEqual(["driver.nickname", "lapCount"]);
    expect(res.data?.columnWidths).toEqual({ lapCount: 100 });
  });

  describe("formatImportErrorMessage", () => {
    const mockTranslationService = {
      translate: (key: string, params?: any) => {
        if (key === "UE_ERROR_IMPORT_REASON") {
          return `Reason: ${params?.reason}`;
        }
        return `TRANS_${key}`;
      },
    };

    it("should return base message when no reasonKey or errorDetail provided", () => {
      const msg = formatImportErrorMessage(
        mockTranslationService,
        "UE_ERROR_IMPORT_FAILED",
      );
      expect(msg).toBe("TRANS_UE_ERROR_IMPORT_FAILED");
    });

    it("should append translated reason when reasonKey is provided", () => {
      const msg = formatImportErrorMessage(
        mockTranslationService,
        "UE_ERROR_IMPORT_NO_LAYOUT",
        "UE_ERROR_IMPORT_REASON_MISSING_LAYOUT",
      );
      expect(msg).toContain("TRANS_UE_ERROR_IMPORT_NO_LAYOUT");
      expect(msg).toContain(
        "Reason: TRANS_UE_ERROR_IMPORT_REASON_MISSING_LAYOUT",
      );
    });

    it("should append errorDetail when provided without reasonKey", () => {
      const msg = formatImportErrorMessage(
        mockTranslationService,
        "UE_ERROR_IMPORT_INVALID_JSON",
        undefined,
        "Unexpected token at position 12",
      );
      expect(msg).toContain("TRANS_UE_ERROR_IMPORT_INVALID_JSON");
      expect(msg).toContain("Reason: Unexpected token at position 12");
    });

    it("should fallback to default strings if translationService is not provided", () => {
      const msg = formatImportErrorMessage(
        null,
        "UE_ERROR_IMPORT_NO_LAYOUT",
        "Missing layout",
      );
      expect(msg).toContain("Failed to import layout");
      expect(msg).toContain("Reason: Missing layout");
    });
  });

  describe("executeSelectFolder & executeClearFolder", () => {
    it("should select folder and return handle name", async () => {
      const mockFs = {
        selectCustomFolder: jasmine
          .createSpy()
          .and.returnValue(Promise.resolve(true)),
        getCustomDirectoryHandle: jasmine
          .createSpy()
          .and.returnValue(Promise.resolve({ name: "my-custom-ui" })),
      };

      const name = await executeSelectFolder(mockFs);
      expect(name).toBe("my-custom-ui");
    });

    it("should return null if selectCustomFolder fails", async () => {
      const mockFs = {
        selectCustomFolder: jasmine
          .createSpy()
          .and.returnValue(Promise.resolve(false)),
      };

      const name = await executeSelectFolder(mockFs);
      expect(name).toBeNull();
    });

    it("should clear custom folder", async () => {
      const mockFs = {
        clearCustomFolder: jasmine
          .createSpy()
          .and.returnValue(Promise.resolve()),
      };

      await executeClearFolder(mockFs);
      expect(mockFs.clearCustomFolder).toHaveBeenCalled();
    });
  });

  describe("executeSelectWidgetFolder & executeClearWidgetFolder", () => {
    it("should select widget folder and return handle name", async () => {
      const mockFs = {
        selectCustomWidgetFolder: jasmine
          .createSpy()
          .and.returnValue(Promise.resolve(true)),
        getCustomWidgetDirectoryHandle: jasmine
          .createSpy()
          .and.returnValue(Promise.resolve({ name: "my-widgets" })),
      };

      const name = await executeSelectWidgetFolder(mockFs);
      expect(name).toBe("my-widgets");
    });

    it("should return null if selectCustomWidgetFolder fails", async () => {
      const mockFs = {
        selectCustomWidgetFolder: jasmine
          .createSpy()
          .and.returnValue(Promise.resolve(false)),
      };

      const name = await executeSelectWidgetFolder(mockFs);
      expect(name).toBeNull();
    });

    it("should clear custom widget folder", async () => {
      const mockFs = {
        clearCustomWidgetFolder: jasmine
          .createSpy()
          .and.returnValue(Promise.resolve()),
      };

      await executeClearWidgetFolder(mockFs);
      expect(mockFs.clearCustomWidgetFolder).toHaveBeenCalled();
    });
  });

  describe("executeTemplateFileSelected", () => {
    it("should read selected file as data URL, set base64 on settings, clear input value, and invoke callback", (done) => {
      const file = new File(["test-xlsx-content"], "template.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const input = {
        files: [file],
        value: "C:\\fakepath\\template.xlsx",
      };

      const event = { target: input } as unknown as Event;
      const settings = new Settings();

      executeTemplateFileSelected(event, settings, () => {
        expect(settings.customExportTemplateBase64).toBeDefined();
        expect(settings.customExportTemplateBase64).toContain("data:");
        expect(settings.customExportTemplateName).toBe("template.xlsx");
        expect(settings.customExportTemplatePath).toBe("template.xlsx");
        expect(input.value).toBe("");
        done();
      });
    });

    it("should extract full path when file.path is available (desktop runtimes)", (done) => {
      const file = new File(["test-xlsx-content"], "custom_report.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      (file as any).path = "/Users/test/Documents/custom_report.xlsx";
      const input = {
        files: [file],
        value: "C:\\fakepath\\custom_report.xlsx",
      };

      const event = { target: input } as unknown as Event;
      const settings = new Settings();

      executeTemplateFileSelected(event, settings, () => {
        expect(settings.customExportTemplateName).toBe("custom_report.xlsx");
        expect(settings.customExportTemplatePath).toBe(
          "/Users/test/Documents/custom_report.xlsx",
        );
        done();
      });
    });

    it("should not invoke callback if no files are selected", () => {
      const input = document.createElement("input");
      input.type = "file";
      Object.defineProperty(input, "files", {
        value: [],
        writable: true,
      });

      const event = { target: input } as unknown as Event;
      const settings = new Settings();
      const onLoaded = jasmine.createSpy("onLoaded");

      executeTemplateFileSelected(event, settings, onLoaded);
      expect(onLoaded).not.toHaveBeenCalled();
      expect(settings.customExportTemplateBase64).toBeUndefined();
    });
  });
});
