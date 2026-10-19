import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";

import {
  buildLayoutExport,
  executeClearFolder,
  executeClearWidgetFolder,
  executeSelectFolder,
  executeSelectWidgetFolder,
  executeTemplateFileSelected,
  exportMigrationDiagnostics,
  getDefaultLayoutResetData,
  parseLayoutImport,
  preMigrationLayoutCache,
  restorePreMigrationLayout,
  upgradePreservedHeatViewLayout,
} from "./ui-editor-io.helper";

describe("ui-editor-io.helper", () => {
  it("should get default layout reset data for raceday and practice", () => {
    const racedayData = getDefaultLayoutResetData(false, 1920, 1080);
    expect(racedayData.defaultLayout).toBeDefined();
    expect(racedayData.columns).toBeDefined();

    const practiceData = getDefaultLayoutResetData(true, 1920, 1080);
    expect(practiceData.defaultLayout).toBeDefined();
    expect(practiceData.columns).toBeDefined();
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
    expect(parsed?.columns).toBeDefined();
  });

  it("should return null for invalid JSON", () => {
    const parsed = parseLayoutImport("invalid-json{", false);
    expect(parsed).toBeNull();
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

  describe("migration actions", () => {
    it("should restore pre-migration layout and set preserveLegacyHeatView", () => {
      const ui: CustomUI = {
        entity_id: "ui_1",
        name: "My Custom Heat Layout",
        is_default: false,
        layoutJson: '{"widgets":[{"widgetType":"lane-column"}]}',
      };
      const customUIs: CustomUI[] = [
        ui,
        {
          entity_id: "backup_1",
          name: "My Custom Heat Layout (Pre-Migration Backup)",
          is_default: false,
          layoutJson: '{"widgets":[{"widgetType":"lane-view"}]}',
          columnsJson: '["driver.nickname"]',
        },
      ];

      const res = restorePreMigrationLayout(ui, customUIs);
      expect(res.restored).toBeTrue();
      expect(res.layout?.preserveLegacyHeatView).toBeTrue();
      expect(res.layout?.widgets[0].widgetType).toBe("lane-view");
      expect(ui.columnsJson).toBe('["driver.nickname"]');

      const parsed = JSON.parse(ui.layoutJson!);
      expect(parsed.preserveLegacyHeatView).toBeTrue();
      expect(parsed.widgets[0].widgetType).toBe("lane-view");
    });

    it("should restore from _preMigrationLayout if backup entity does not exist", () => {
      const ui: CustomUI = {
        entity_id: "ui_2",
        name: "Quick Layout",
        is_default: false,
        layoutJson: '{"widgets":[{"widgetType":"lane-column"}]}',
      };
      (ui as any)._preMigrationLayout = {
        widgets: [{ id: "w-old", widgetType: "lane-view" }],
      };

      const res = restorePreMigrationLayout(ui, [ui]);
      expect(res.restored).toBeTrue();
      expect(res.layout?.preserveLegacyHeatView).toBeTrue();
      expect(res.layout?.widgets[0].widgetType).toBe("lane-view");
    });

    it("should restore from preMigrationLayoutCache if backup entity and _preMigrationLayout are absent", () => {
      const ui: CustomUI = {
        entity_id: "ui_cache",
        name: "Cached Layout",
        is_default: false,
        layoutJson: '{"widgets":[{"widgetType":"lane-column"}]}',
      };
      preMigrationLayoutCache.set("ui_cache", {
        widgets: [{ id: "w-cached", widgetType: "lane-view" } as any],
      });

      const res = restorePreMigrationLayout(ui, [ui]);
      expect(res.restored).toBeTrue();
      expect(res.layout?.preserveLegacyHeatView).toBeTrue();
      expect(res.layout?.widgets[0].widgetType).toBe("lane-view");
    });

    it("should restore from Settings.DEFAULT_LAYOUT for default UI when backup entity is absent", () => {
      const ui: CustomUI = {
        entity_id: "default_ui_layout_rc_ai",
        name: "RaceCoordinator AI",
        is_default: true,
        layoutJson: '{"widgets":[{"widgetType":"lane-column"}]}',
      };

      const res = restorePreMigrationLayout(ui, [ui]);
      expect(res.restored).toBeTrue();
      expect(res.layout?.preserveLegacyHeatView).toBeTrue();
      expect(
        res.layout?.widgets.some((w) => w.widgetType === "lane-view"),
      ).toBeTrue();
    });

    it("should return restored false if no backup or pre-migration layout exists for custom layout", () => {
      const ui: CustomUI = {
        entity_id: "ui_3",
        name: "No Backup Layout",
        is_default: false,
        layoutJson: '{"widgets":[]}',
      };

      const res = restorePreMigrationLayout(ui, [ui]);
      expect(res.restored).toBeFalse();
    });

    it("should upgrade preserved legacy heat-view layout", () => {
      const ui: CustomUI = {
        entity_id: "ui_4",
        name: "Preserved Layout",
        is_default: false,
        layoutJson: JSON.stringify({
          preserveLegacyHeatView: true,
          widgets: [
            {
              id: "w-lane",
              widgetType: "lane-view",
              x: 0,
              y: 0,
              width: 800,
              height: 400,
              zIndex: 100,
            },
          ],
        }),
      };

      const res = upgradePreservedHeatViewLayout(ui, false);
      expect(res.upgraded).toBeTrue();
      expect(res.layout?.preserveLegacyHeatView).toBeUndefined();
      expect(
        res.layout?.widgets.some((w) => w.widgetType === "lane-column"),
      ).toBeTrue();
      const parsed = JSON.parse(ui.layoutJson!);
      expect(parsed.preserveLegacyHeatView).toBeUndefined();
    });

    it("should export migration diagnostics", () => {
      const ui: CustomUI = {
        entity_id: "ui_5",
        name: "Diag Layout",
        is_default: false,
        layoutJson: '{"widgets":[]}',
      };
      (ui as any)._wasMigrated = true;
      (ui as any)._preMigrationLayout = {
        widgets: [{ widgetType: "lane-view" }],
      };

      expect(() =>
        exportMigrationDiagnostics(ui, { widgets: [] }),
      ).not.toThrow();
    });
  });
});
