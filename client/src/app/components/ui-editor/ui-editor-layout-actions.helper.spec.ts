import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";

import {
  applyClearLayout,
  applyResetLayout,
  executeClearLayout,
  handleClearCurrentLayout,
  handleClearLayout,
  handleExportPracticeRacedayLayout,
  handleExportRacedayLayout,
  handleImportPracticeRacedayLayout,
  handleImportRacedayLayout,
  handleResetCurrentLayout,
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
    it("should clear widgets, reset selectedWidgetId to null, capture state, and refresh display", () => {
      handleClearLayout(mockComp, ui);

      expect(mockComp.selectedWidgetId).toBeNull();
      expect(mockComp.undoManager.captureState).toHaveBeenCalled();
      expect(mockComp.refreshDisplayProperties).toHaveBeenCalled();
      expect(mockComp.cdr.detectChanges).toHaveBeenCalled();
      expect(JSON.parse(ui.layoutJson!).widgets).toEqual([]);
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
});
