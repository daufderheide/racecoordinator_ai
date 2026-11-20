import { LaneGridAnimationHelper } from "@app/components/raceday/utils/lane-grid-animation.helper";
import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";

import {
  applyClearLayout,
  applyImportLayout,
  applyImportLayoutDetailed,
  applyResetLayout,
  executeClearLayout,
  executeImportLayout,
  handleClearCurrentLayout,
  handleClearLayout,
  handleExportPracticeRacedayLayout,
  handleExportRacedayLayout,
  handleImportPracticeRacedayLayout,
  handleImportRacedayLayout,
  handleResetCurrentLayout,
  handleResetLayout,
  handleResetPracticeRacedayLayout,
  handleResetRacedayLayout,
} from "./ui-editor-layout-actions.helper";

describe("ui-editor-layout-actions.helper", () => {
  let ui: CustomUI;
  let settings: Settings;
  let mockComp: any;

  beforeEach(() => {
    settings = new Settings();
    ui = {
      entity_id: "default_ui_layout_rc_ai",
      name: "Default UI",
      is_default: true,
      layoutJson: JSON.stringify({
        baseWidth: 1920,
        baseHeight: 1080,
        scaleMode: "letterbox",
        aspectRatio: "16:9",
        widgets: [
          {
            id: "w1",
            widgetType: "lane-view",
            x: 10,
            y: 10,
            width: 100,
            height: 100,
          },
          { id: "w2", widgetType: "flag", x: 20, y: 20, width: 50, height: 50 },
        ],
      }),
    };

    mockComp = {
      editingSettings: settings,
      editingState: { settings: new Settings() },
      selectedWidgetId: "w1",
      selectedAnchor: "top",
      activeGridSession: { gridId: "grid-test" },
      parsedLayouts: new Map(),
      syncRacedayPreview: jasmine.createSpy("syncRacedayPreview"),
      captureState: jasmine
        .createSpy("captureState")
        .and.callFake(() => mockComp.undoManager.captureState()),
      undoManager: { captureState: jasmine.createSpy("captureState") },
      refreshDisplayProperties: jasmine.createSpy("refreshDisplayProperties"),
      cdr: { detectChanges: jasmine.createSpy("detectChanges") },
      clearLayout: jasmine.createSpy("clearLayout"),
      resetLayout: jasmine.createSpy("resetLayout"),
      resetRacedayLayout: jasmine.createSpy("resetRacedayLayout"),
      resetPracticeRacedayLayout: jasmine.createSpy(
        "resetPracticeRacedayLayout",
      ),
      getTargetCustomUi: jasmine
        .createSpy("getTargetCustomUi")
        .and.returnValue(ui),
      activeCustomUiId: "default_ui_layout_rc_ai",
      activeCustomUi: ui,
      isCurrentLayoutPractice: false,
    };
  });

  describe("applyResetLayout", () => {
    it("should reset layout and column JSON and update settings for raceday layout", () => {
      applyResetLayout(ui, settings);

      expect(ui.layoutJson).toBeDefined();
      expect(ui.columnsJson).toBeDefined();
      expect(settings.racedayLayout).toBeDefined();
      expect(settings.racedayColumns).toBeDefined();
    });

    it("should update settings for practice layout", () => {
      const practiceUi: CustomUI = {
        entity_id: "practice_ui_layout_rc_ai",
        name: "Practice UI",
        is_default: false,
      };

      applyResetLayout(practiceUi, settings);

      expect(practiceUi.layoutJson).toBeDefined();
      expect(settings.practiceRacedayLayout).toBeDefined();
      expect(settings.practiceRacedayColumns).toBeDefined();
    });
  });

  describe("applyClearLayout and executeClearLayout", () => {
    it("should clear all widgets from ui.layoutJson while preserving canvas dimensions", () => {
      applyClearLayout(ui, settings);

      const parsed = JSON.parse(ui.layoutJson!);
      expect(parsed.widgets).toEqual([]);
      expect(parsed.baseWidth).toBe(1920);
      expect(parsed.baseHeight).toBe(1080);
      expect(parsed.scaleMode).toBe("letterbox");
      expect(parsed.aspectRatio).toBe("16:9");
    });

    it("should update editingSettings.racedayLayout when clearing default ui layout", () => {
      applyClearLayout(ui, settings);

      expect(settings.racedayLayout?.widgets).toEqual([]);
      expect(settings.racedayLayout?.baseWidth).toBe(1920);
    });

    it("should update editingSettings.practiceRacedayLayout when clearing practice ui layout", () => {
      const practiceUi: CustomUI = {
        entity_id: "practice_ui_layout_rc_ai",
        name: "Practice UI",
        is_default: false,
        layoutJson: JSON.stringify({
          baseWidth: 1280,
          baseHeight: 720,
          widgets: [{ id: "pw1", widgetType: "lane-view" }],
        }),
      };

      executeClearLayout(practiceUi, settings);

      const parsed = JSON.parse(practiceUi.layoutJson!);
      expect(parsed.widgets).toEqual([]);
      expect(settings.practiceRacedayLayout?.widgets).toEqual([]);
    });

    it("should fall back to default layout when ui.layoutJson is undefined", () => {
      const emptyUi: CustomUI = {
        entity_id: "custom_empty_ui",
        name: "Custom Empty",
        is_default: false,
      };

      applyClearLayout(emptyUi, settings);

      const parsed = JSON.parse(emptyUi.layoutJson!);
      expect(parsed.widgets).toEqual([]);
    });
  });

  describe("handleClearLayout", () => {
    it("should clear widgets, reset selectedWidgetId to null, deactivate countdown preview, capture state, and refresh display", () => {
      mockComp.countdownPreviewActiveByUi = { [ui.entity_id]: true };
      handleClearLayout(mockComp, ui);

      expect(mockComp.selectedWidgetId).toBeNull();
      expect(mockComp.selectedAnchor).toBeNull();
      expect(mockComp.activeGridSession).toBeNull();
      expect(mockComp.syncRacedayPreview).toHaveBeenCalledWith(
        jasmine.objectContaining({ widgets: [] }),
        ui,
      );
      expect(mockComp.parsedLayouts.get(ui.entity_id)?.widgets).toEqual([]);
      expect(mockComp.countdownPreviewActiveByUi[ui.entity_id]).toBeFalse();
      expect(mockComp.undoManager.captureState).toHaveBeenCalled();
      expect(mockComp.refreshDisplayProperties).toHaveBeenCalled();
      expect(mockComp.cdr.detectChanges).toHaveBeenCalled();
      expect(JSON.parse(ui.layoutJson!).widgets).toEqual([]);
    });

    it("should remove grid by clearing activeGridSession, resetting animation helper, and synchronizing preview when layout has grid widgets", () => {
      const gridUi: CustomUI = {
        entity_id: "grid_ui",
        name: "Grid UI",
        is_default: false,
        layoutJson: JSON.stringify({
          baseWidth: 1920,
          baseHeight: 1080,
          widgets: [
            {
              id: "w-grid-1",
              widgetType: "lane-column",
              customSettings: { gridId: "grid-test" },
            },
            {
              id: "w-grid-2",
              widgetType: "lane-column",
              customSettings: { gridId: "grid-test" },
            },
          ],
        }),
      };
      mockComp.activeGridSession = { gridId: "grid-test" };
      mockComp.currentSelectedWidget = { id: "w-grid-1" };
      spyOn(LaneGridAnimationHelper, "reset").and.callThrough();

      handleClearLayout(mockComp, gridUi);

      expect(mockComp.activeGridSession).toBeNull();
      expect(LaneGridAnimationHelper.reset).toHaveBeenCalled();
      expect(mockComp.currentSelectedWidget).toBeNull();
      expect(mockComp.syncRacedayPreview).toHaveBeenCalledWith(
        jasmine.objectContaining({ widgets: [] }),
        gridUi,
      );
      expect(JSON.parse(gridUi.layoutJson!).widgets).toEqual([]);
    });

    it("should fall back to activeCustomUi when ui parameter is not passed", () => {
      handleClearLayout(mockComp);

      expect(mockComp.activeGridSession).toBeNull();
      expect(mockComp.syncRacedayPreview).toHaveBeenCalledWith(
        jasmine.objectContaining({ widgets: [] }),
        ui,
      );
      expect(JSON.parse(ui.layoutJson!).widgets).toEqual([]);
    });
  });

  describe("handleResetLayout", () => {
    it("should reset layout, clear activeGridSession, reset animation helper, and sync preview", () => {
      mockComp.activeGridSession = { gridId: "grid-test" };
      spyOn(LaneGridAnimationHelper, "reset").and.callThrough();

      handleResetLayout(mockComp, ui);

      expect(mockComp.activeGridSession).toBeNull();
      expect(LaneGridAnimationHelper.reset).toHaveBeenCalled();
      expect(mockComp.syncRacedayPreview).toHaveBeenCalled();
      expect(mockComp.undoManager.captureState).toHaveBeenCalled();
      expect(mockComp.refreshDisplayProperties).toHaveBeenCalled();
      expect(mockComp.cdr.detectChanges).toHaveBeenCalled();
      expect(ui.layoutJson).toBeDefined();
    });
  });

  describe("handleClearCurrentLayout", () => {
    it("should clear practice layout when isCurrentLayoutPractice is true", () => {
      mockComp.isCurrentLayoutPractice = true;
      const practiceUi = { entity_id: "practice_ui_layout_rc_ai" } as CustomUI;
      mockComp.getTargetCustomUi.and.returnValue(practiceUi);

      handleClearCurrentLayout(mockComp);

      expect(mockComp.getTargetCustomUi).toHaveBeenCalledWith("practice");
      expect(mockComp.clearLayout).toHaveBeenCalledWith(practiceUi);
    });

    it("should clear raceday layout when activeCustomUiId is default_ui_layout_rc_ai", () => {
      mockComp.isCurrentLayoutPractice = false;
      mockComp.activeCustomUiId = "default_ui_layout_rc_ai";

      handleClearCurrentLayout(mockComp);

      expect(mockComp.getTargetCustomUi).toHaveBeenCalledWith("raceday");
      expect(mockComp.clearLayout).toHaveBeenCalledWith(ui);
    });

    it("should clear activeCustomUi when a custom UI is active", () => {
      mockComp.isCurrentLayoutPractice = false;
      mockComp.activeCustomUiId = "custom_123";
      const customUi = { entity_id: "custom_123" } as CustomUI;
      mockComp.activeCustomUi = customUi;

      handleClearCurrentLayout(mockComp);

      expect(mockComp.clearLayout).toHaveBeenCalledWith(customUi);
    });
  });

  describe("handleResetCurrentLayout", () => {
    it("should call resetPracticeRacedayLayout when practice mode is active", () => {
      mockComp.isCurrentLayoutPractice = true;

      handleResetCurrentLayout(mockComp);

      expect(mockComp.resetPracticeRacedayLayout).toHaveBeenCalled();
    });

    it("should call resetRacedayLayout when default UI is active", () => {
      mockComp.isCurrentLayoutPractice = false;
      mockComp.activeCustomUiId = "default_ui_layout_rc_ai";

      handleResetCurrentLayout(mockComp);

      expect(mockComp.resetRacedayLayout).toHaveBeenCalled();
    });

    it("should call resetLayout with activeCustomUi when a custom layout is active", () => {
      mockComp.isCurrentLayoutPractice = false;
      mockComp.activeCustomUiId = "custom_456";
      const customUi = { entity_id: "custom_456" } as CustomUI;
      mockComp.activeCustomUi = customUi;

      handleResetCurrentLayout(mockComp);

      expect(mockComp.resetLayout).toHaveBeenCalledWith(customUi);
    });
  });

  describe("targeted layout actions", () => {
    it("should handle reset raceday layout", () => {
      handleResetRacedayLayout(mockComp);
      expect(mockComp.getTargetCustomUi).toHaveBeenCalledWith("raceday");
      expect(mockComp.resetLayout).toHaveBeenCalledWith(ui);
    });

    it("should handle reset practice raceday layout", () => {
      handleResetPracticeRacedayLayout(mockComp);
      expect(mockComp.selectedWidgetId).toBe("widget-lane-view");
      expect(mockComp.getTargetCustomUi).toHaveBeenCalledWith("practice");
      expect(mockComp.resetLayout).toHaveBeenCalledWith(ui);
    });

    it("should handle export raceday and practice layouts", () => {
      mockComp.exportLayout = jasmine.createSpy("exportLayout");
      handleExportRacedayLayout(mockComp);
      expect(mockComp.exportLayout).toHaveBeenCalledWith(ui);

      handleExportPracticeRacedayLayout(mockComp);
      expect(mockComp.exportLayout).toHaveBeenCalledWith(ui);
    });

    it("should handle import raceday and practice layouts", () => {
      mockComp.onImportLayout = jasmine.createSpy("onImportLayout");
      const event = {} as Event;
      handleImportRacedayLayout(mockComp, event);
      expect(mockComp.onImportLayout).toHaveBeenCalledWith(event, ui);

      handleImportPracticeRacedayLayout(mockComp, event);
      expect(mockComp.onImportLayout).toHaveBeenCalledWith(event, ui);
    });
  });

  describe("applyImportLayout and executeImportLayout", () => {
    it("should apply imported layout from CustomUI layoutJson string", () => {
      const customUiJson = JSON.stringify({
        name: "Four Rows Layout",
        entity_id: "rcai-four-rows",
        layoutJson: JSON.stringify({
          baseWidth: 1920,
          baseHeight: 1080,
          scaleMode: "letterbox",
          widgets: [
            {
              id: "w-imported-1",
              widgetType: "lane-column",
              x: 10,
              y: 20,
              width: 200,
              height: 100,
            },
          ],
        }),
        columnsJson: "[]",
        columnLayoutsJson: "{}",
        columnVisibilityJson: "{}",
        columnWidthsJson: "{}",
        columnAnchorsJson: "{}",
      });

      const result = applyImportLayoutDetailed(customUiJson, ui, settings);
      expect(result.success).toBeTrue();
      expect(ui.layoutJson).toContain("w-imported-1");
      expect(settings.racedayLayout?.widgets?.[0]?.id).toBe("w-imported-1");

      const boolResult = applyImportLayout(customUiJson, ui, settings);
      expect(boolResult).toBeTrue();
    });

    it("should return failure with UE_ERROR_IMPORT_INVALID_JSON for invalid JSON", () => {
      const result = applyImportLayoutDetailed("{invalid-json", ui, settings);
      expect(result.success).toBeFalse();
      expect(result.errorKey).toBe("UE_ERROR_IMPORT_INVALID_JSON");
      expect(applyImportLayout("{invalid-json", ui, settings)).toBeFalse();
    });

    it("should return failure with UE_ERROR_IMPORT_NO_LAYOUT when JSON has no layout", () => {
      const result = applyImportLayoutDetailed(
        JSON.stringify({ notALayout: true }),
        ui,
        settings,
      );
      expect(result.success).toBeFalse();
      expect(result.errorKey).toBe("UE_ERROR_IMPORT_NO_LAYOUT");
      expect(
        applyImportLayout(JSON.stringify({ notALayout: true }), ui, settings),
      ).toBeFalse();
    });

    it("should alert when executeImportLayout encounters an invalid layout", () => {
      spyOn(window, "alert");
      const mockTranslation = {
        translate: jasmine
          .createSpy("translate")
          .and.callFake((key: string) => `Translated:${key}`),
      };
      const mockLogger = {
        error: jasmine.createSpy("error"),
      };
      const onSuccess = jasmine.createSpy("onSuccess");

      const file = new File([JSON.stringify({ empty: true })], "test.json", {
        type: "application/json",
      });
      const input = {
        files: [file],
        value: "test.json",
      } as unknown as HTMLInputElement;
      const event = { target: input } as unknown as Event;

      const dummyFileReader = {
        readAsText: jasmine.createSpy("readAsText").and.callFake(function (
          this: any,
        ) {
          this.onload({ target: { result: JSON.stringify({ empty: true }) } });
        }),
      };
      spyOn(window as any, "FileReader").and.returnValue(
        dummyFileReader as any,
      );

      executeImportLayout(
        event,
        ui,
        settings,
        mockLogger,
        onSuccess,
        mockTranslation,
      );

      expect(window.alert).toHaveBeenCalledWith(
        jasmine.stringMatching(/Translated:UE_ERROR_IMPORT_NO_LAYOUT/),
      );
      expect(onSuccess).not.toHaveBeenCalled();
      expect(input.value).toBe("");
    });

    it("should display modal instead of alert when comp has showImportErrorModal", () => {
      spyOn(window, "alert");
      const mockTranslation = {
        translate: jasmine
          .createSpy("translate")
          .and.callFake((key: string) => `Translated:${key}`),
      };
      const mockLogger = {
        error: jasmine.createSpy("error"),
      };
      const onSuccess = jasmine.createSpy("onSuccess");
      const compTarget: any = {
        showImportErrorModal: false,
        importErrorTitle: "",
        importErrorMessage: "",
        cdr: { markForCheck: jasmine.createSpy("markForCheck") },
      };

      const file = new File([JSON.stringify({ empty: true })], "test.json", {
        type: "application/json",
      });
      const input = {
        files: [file],
        value: "test.json",
      } as unknown as HTMLInputElement;
      const event = { target: input } as unknown as Event;

      const dummyFileReader = {
        readAsText: jasmine.createSpy("readAsText").and.callFake(function (
          this: any,
        ) {
          this.onload({ target: { result: JSON.stringify({ empty: true }) } });
        }),
      };
      spyOn(window as any, "FileReader").and.returnValue(
        dummyFileReader as any,
      );

      executeImportLayout(
        event,
        ui,
        settings,
        mockLogger,
        onSuccess,
        mockTranslation,
        compTarget,
      );

      expect(window.alert).not.toHaveBeenCalled();
      expect(compTarget.showImportErrorModal).toBeTrue();
      expect(compTarget.importErrorTitle).toBe("UE_ERROR_IMPORT_TITLE");
      expect(compTarget.importErrorMessage).toContain(
        "Translated:UE_ERROR_IMPORT_NO_LAYOUT",
      );
      expect(compTarget.cdr.markForCheck).toHaveBeenCalled();
    });

    it("should alert when executeImportLayout encounters file read error", () => {
      spyOn(window, "alert");
      const mockTranslation = {
        translate: jasmine
          .createSpy("translate")
          .and.callFake((key: string) => `Translated:${key}`),
      };
      const mockLogger = {
        error: jasmine.createSpy("error"),
      };
      const onSuccess = jasmine.createSpy("onSuccess");

      const file = new File(["data"], "test.json", {
        type: "application/json",
      });
      const input = {
        files: [file],
        value: "test.json",
      } as unknown as HTMLInputElement;
      const event = { target: input } as unknown as Event;

      const dummyFileReader = {
        readAsText: jasmine.createSpy("readAsText").and.callFake(function (
          this: any,
        ) {
          this.onerror(new Error("disk error"));
        }),
      };
      spyOn(window as any, "FileReader").and.returnValue(
        dummyFileReader as any,
      );

      executeImportLayout(
        event,
        ui,
        settings,
        mockLogger,
        onSuccess,
        mockTranslation,
      );

      expect(window.alert).toHaveBeenCalledWith(
        jasmine.stringMatching(/Translated:UE_ERROR_IMPORT_READ_FAILED/),
      );
      expect(mockLogger.error).toHaveBeenCalled();
      expect(onSuccess).not.toHaveBeenCalled();
    });
  });
});
