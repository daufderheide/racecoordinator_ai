import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";

import {
  buildLayoutExport,
  executeClearFolder,
  executeClearWidgetFolder,
  executeSelectFolder,
  executeSelectWidgetFolder,
  executeTemplateFileSelected,
  getDefaultLayoutResetData,
  parseLayoutImport,
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
});
