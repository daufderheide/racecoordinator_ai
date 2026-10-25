import { of, throwError } from "rxjs";
import { CustomUI } from "@app/models/custom-ui";
import { Settings } from "@app/models/settings";
import { Theme } from "@app/models/theme";

import {
  applyLoadedUiEditorData,
  ensureDefaultCustomUis,
  fetchUiEditorData,
  handleUiEditorDataLoadError,
  handleUiEditorKeyboardShortcut,
  normalizeLoadedCustomUis,
  normalizeLoadedThemes,
  processLoadedEditorData,
  refreshUiEditorDisplayProperties,
  resolveBackNavigation,
} from "./ui-editor-data.helper";

describe("ui-editor-data.helper", () => {
  it("should ensure default custom UIs for raceday, practice, and fuel", () => {
    const uis: CustomUI[] = [];
    const settings = new Settings();

    ensureDefaultCustomUis(uis, settings);
    expect(uis.length).toBe(3);
    expect(
      uis.some((u) => u.entity_id === "default_ui_layout_rc_ai"),
    ).toBeTrue();
    expect(
      uis.some((u) => u.entity_id === "practice_ui_layout_rc_ai"),
    ).toBeTrue();
    expect(
      uis.some((u) => u.entity_id === "default_fuel_ui_layout_rc_ai"),
    ).toBeTrue();
  });

  it("should normalize loaded custom UIs without adding missing defaults", () => {
    const uis: CustomUI[] = [
      {
        entity_id: "default_ui_layout_rc_ai",
        name: "Default UI Layout",
        is_default: true,
      },
    ];
    normalizeLoadedCustomUis(uis);
    expect(uis.length).toBe(1);
    expect(uis[0].name).toBe("RaceCoordinator AI");
    expect(
      uis.some((u) => u.entity_id === "practice_ui_layout_rc_ai"),
    ).toBeFalse();
    expect(
      uis.some((u) => u.entity_id === "default_fuel_ui_layout_rc_ai"),
    ).toBeFalse();
  });

  it("should rename legacy default custom UI names to canonical names and preserve custom UIs", () => {
    const uis: CustomUI[] = [
      {
        entity_id: "default_ui_layout_rc_ai",
        name: "Default UI Layout",
        is_default: true,
      },
      {
        entity_id: "practice_ui_layout_rc_ai",
        name: "Practice UI Layout",
        is_default: true,
      },
      {
        entity_id: "default_fuel_ui_layout_rc_ai",
        name: "Fuel UI",
        is_default: true,
      },
      {
        entity_id: "custom_ui_1",
        name: "My Custom Layout",
        is_default: false,
      },
    ];
    const settings = new Settings();

    ensureDefaultCustomUis(uis, settings);
    expect(
      uis.find((u) => u.entity_id === "default_ui_layout_rc_ai")?.name,
    ).toBe("RaceCoordinator AI");
    expect(
      uis.find((u) => u.entity_id === "practice_ui_layout_rc_ai")?.name,
    ).toBe("RaceCoordinator AI (Practice)");
    expect(
      uis.find((u) => u.entity_id === "default_fuel_ui_layout_rc_ai")?.name,
    ).toBe("RaceCoordinator AI (Fuel)");
    expect(uis.find((u) => u.entity_id === "custom_ui_1")?.name).toBe(
      "My Custom Layout",
    );
  });

  it("should migrate legacy fuel custom UI with entity_id '2'", () => {
    const uis: CustomUI[] = [
      {
        entity_id: "2",
        name: "Fuel UI",
        is_default: true,
      },
    ];
    const settings = new Settings();

    ensureDefaultCustomUis(uis, settings);
    const fuelUi = uis.find(
      (u) => u.entity_id === "default_fuel_ui_layout_rc_ai",
    );
    expect(fuelUi).toBeDefined();
    expect(fuelUi?.name).toBe("RaceCoordinator AI (Fuel)");
    expect(uis.some((u) => u.entity_id === "2")).toBeFalse();
  });

  it("should NOT migrate custom UI with entity_id '2' if it is not default or legacy fuel UI", () => {
    const uis: CustomUI[] = [
      {
        entity_id: "2",
        name: "Custom Leaderboard",
        is_default: false,
      },
    ];
    const settings = new Settings();

    ensureDefaultCustomUis(uis, settings);
    const customUi = uis.find((u) => u.entity_id === "2");
    expect(customUi).toBeDefined();
    expect(customUi?.name).toBe("Custom Leaderboard");
    expect(customUi?.entity_id).toBe("2");
    expect(customUi?.is_default).toBeFalse();

    // Default fuel UI should be created independently
    const fuelUi = uis.find(
      (u) => u.entity_id === "default_fuel_ui_layout_rc_ai",
    );
    expect(fuelUi).toBeDefined();
    expect(fuelUi?.name).toBe("RaceCoordinator AI (Fuel)");
  });

  it("should preserve custom theme uiId when pointing to custom UI '2'", () => {
    const customTheme: Theme = {
      entity_id: "3",
      name: "Custom Leaderboard Theme",
      is_default: false,
      uiId: "2",
      slots: {},
      audio_slots: {},
    };
    normalizeLoadedThemes([customTheme]);
    expect(customTheme.uiId).toBe("2");
    expect(customTheme.name).toBe("Custom Leaderboard Theme");
    expect(customTheme.entity_id).toBe("3");
  });

  it("should process loaded editor data and normalize legacy themes", () => {
    const defaultTheme: Theme = {
      entity_id: "default_classic_rc_ai",
      name: "Classic Theme",
      is_default: true,
      slots: {},
      audio_slots: {},
    };
    const practiceTheme: Theme = {
      entity_id: "practice_theme_rc_ai",
      name: "Practice Theme",
      is_default: true,
      slots: {},
      audio_slots: {},
    };
    const fuelTheme: Theme = {
      entity_id: "default_fuel_theme_rc_ai",
      name: "Fuel Theme",
      is_default: true,
      slots: {},
      audio_slots: {},
    };
    const customTheme: Theme = {
      entity_id: "custom_theme_1",
      name: "My Custom Theme",
      is_default: false,
      slots: {},
      audio_slots: {},
    };

    const rawData = {
      assets: [
        { id: "img1", type: "image", name: "Flag" },
        { id: "audio1", type: "audio", name: "Beep" },
        { id: "other", type: "other_type", name: "Other" },
      ],
      dirHandle: { name: "custom-folder" },
      widgetDirHandle: { name: "custom-widgets" },
      themes: [defaultTheme, practiceTheme, fuelTheme, customTheme],
      tracks: [{ id: "track1" }],
      customUIs: [],
    };

    const currentSettings = new Settings();
    const setActiveThemeSpy = jasmine.createSpy("setActiveTheme");

    const result = processLoadedEditorData(
      rawData as any,
      currentSettings,
      setActiveThemeSpy,
    );

    expect(result.filteredAssets.length).toBe(2);
    expect(result.soundAssets.length).toBe(1);
    expect(result.customDirectoryName).toBe("custom-folder");
    expect(result.customWidgetDirectoryName).toBe("custom-widgets");
    expect(result.track).toEqual({ id: "track1" });
    expect(result.initialState.customUIs?.length).toBe(3);

    const loadedThemes = result.initialState.themes;
    expect(
      loadedThemes.find((t) => t.entity_id === "default_classic_rc_ai")?.name,
    ).toBe("RaceCoordinator AI");
    expect(
      loadedThemes.find((t) => t.entity_id === "practice_theme_rc_ai")?.name,
    ).toBe("RaceCoordinator AI (Practice)");
    expect(
      loadedThemes.find((t) => t.entity_id === "default_fuel_theme_rc_ai")
        ?.name,
    ).toBe("RaceCoordinator AI (Fuel)");
    expect(
      loadedThemes.find((t) => t.entity_id === "custom_theme_1")?.name,
    ).toBe("My Custom Theme");
  });

  it("should preserve deletion of default custom UIs in processLoadedEditorData when remaining custom UIs exist", () => {
    const defaultTheme: Theme = {
      entity_id: "default_classic_rc_ai",
      name: "Default Theme",
      is_default: true,
      slots: {},
      audio_slots: {},
    };
    const rawData = {
      assets: [],
      dirHandle: null,
      widgetDirHandle: null,
      themes: [defaultTheme],
      tracks: [],
      customUIs: [
        {
          entity_id: "default_ui_layout_rc_ai",
          name: "RaceCoordinator AI",
          is_default: true,
        },
      ],
    };
    const currentSettings = new Settings();
    const result = processLoadedEditorData(
      rawData as any,
      currentSettings,
      jasmine.createSpy("setActiveTheme"),
    );
    expect(result.initialState.customUIs?.length).toBe(1);
    expect(result.initialState.customUIs?.[0].entity_id).toBe(
      "default_ui_layout_rc_ai",
    );
  });

  describe("handleUiEditorKeyboardShortcut", () => {
    let onUndo: jasmine.Spy;
    let onRedo: jasmine.Spy;
    let onDelete: jasmine.Spy;
    let onNudge: jasmine.Spy;

    beforeEach(() => {
      onUndo = jasmine.createSpy("onUndo");
      onRedo = jasmine.createSpy("onRedo");
      onDelete = jasmine.createSpy("onDelete");
      onNudge = jasmine.createSpy("onNudge");
    });

    it("should trigger undo on Ctrl+Z and redo on Ctrl+Shift+Z", () => {
      const undoEvent = new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
      });
      spyOn(undoEvent, "preventDefault");
      handleUiEditorKeyboardShortcut(
        undoEvent,
        onUndo,
        onRedo,
        onDelete,
        onNudge,
      );
      expect(undoEvent.preventDefault).toHaveBeenCalled();
      expect(onUndo).toHaveBeenCalled();
      expect(onRedo).not.toHaveBeenCalled();

      const redoEvent = new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        shiftKey: true,
      });
      spyOn(redoEvent, "preventDefault");
      handleUiEditorKeyboardShortcut(
        redoEvent,
        onUndo,
        onRedo,
        onDelete,
        onNudge,
      );
      expect(redoEvent.preventDefault).toHaveBeenCalled();
      expect(onRedo).toHaveBeenCalled();
    });

    it("should trigger redo on Ctrl+Y", () => {
      const redoEvent = new KeyboardEvent("keydown", {
        key: "y",
        ctrlKey: true,
      });
      spyOn(redoEvent, "preventDefault");
      handleUiEditorKeyboardShortcut(
        redoEvent,
        onUndo,
        onRedo,
        onDelete,
        onNudge,
      );
      expect(redoEvent.preventDefault).toHaveBeenCalled();
      expect(onRedo).toHaveBeenCalled();
    });

    it("should trigger onDelete on Delete or Backspace when not in input", () => {
      const delEvent = new KeyboardEvent("keydown", { key: "Delete" });
      spyOn(delEvent, "preventDefault");
      handleUiEditorKeyboardShortcut(
        delEvent,
        onUndo,
        onRedo,
        onDelete,
        onNudge,
      );
      expect(delEvent.preventDefault).toHaveBeenCalled();
      expect(onDelete).toHaveBeenCalled();

      const backspaceEvent = new KeyboardEvent("keydown", { key: "Backspace" });
      spyOn(backspaceEvent, "preventDefault");
      handleUiEditorKeyboardShortcut(
        backspaceEvent,
        onUndo,
        onRedo,
        onDelete,
        onNudge,
      );
      expect(backspaceEvent.preventDefault).toHaveBeenCalled();
      expect(onDelete).toHaveBeenCalledTimes(2);
    });

    it("should NOT trigger onDelete or onNudge when focused on input/textarea", () => {
      const input = document.createElement("input");
      const delEvent = new KeyboardEvent("keydown", { key: "Delete" });
      Object.defineProperty(delEvent, "target", { value: input });
      spyOn(delEvent, "preventDefault");

      handleUiEditorKeyboardShortcut(
        delEvent,
        onUndo,
        onRedo,
        onDelete,
        onNudge,
      );
      expect(delEvent.preventDefault).not.toHaveBeenCalled();
      expect(onDelete).not.toHaveBeenCalled();

      const arrowEvent = new KeyboardEvent("keydown", { key: "ArrowUp" });
      Object.defineProperty(arrowEvent, "target", { value: input });
      spyOn(arrowEvent, "preventDefault");

      handleUiEditorKeyboardShortcut(
        arrowEvent,
        onUndo,
        onRedo,
        onDelete,
        onNudge,
      );
      expect(arrowEvent.preventDefault).not.toHaveBeenCalled();
      expect(onNudge).not.toHaveBeenCalled();
    });

    it("should trigger onNudge with 1px step on Arrow keys and 10px on Shift+Arrow", () => {
      const leftEvent = new KeyboardEvent("keydown", { key: "ArrowLeft" });
      spyOn(leftEvent, "preventDefault");
      handleUiEditorKeyboardShortcut(
        leftEvent,
        onUndo,
        onRedo,
        onDelete,
        onNudge,
      );
      expect(leftEvent.preventDefault).toHaveBeenCalled();
      expect(onNudge).toHaveBeenCalledWith(-1, 0);

      const shiftDownEvent = new KeyboardEvent("keydown", {
        key: "ArrowDown",
        shiftKey: true,
      });
      spyOn(shiftDownEvent, "preventDefault");
      handleUiEditorKeyboardShortcut(
        shiftDownEvent,
        onUndo,
        onRedo,
        onDelete,
        onNudge,
      );
      expect(shiftDownEvent.preventDefault).toHaveBeenCalled();
      expect(onNudge).toHaveBeenCalledWith(0, 10);
    });
  });

  describe("applyLoadedUiEditorData and handleUiEditorDataLoadError", () => {
    it("should process loaded data, refresh display properties, and restore open layout", () => {
      const mockSettings = new Settings();
      const comp: any = {
        settingsService: { getSettings: () => mockSettings },
        themeService: { setActiveTheme: jasmine.createSpy("setActiveTheme") },
        sortAvailableColumns: jasmine.createSpy("sortAvailableColumns"),
        refreshDisplayProperties: jasmine
          .createSpy("refreshDisplayProperties")
          .and.callFake(() => {
            comp.displayCustomUIs = comp.editingState.customUIs;
            comp.displayThemes = comp.editingState.themes;
          }),
        undoManager: { initialize: jasmine.createSpy("initialize") },
        cdr: { markForCheck: jasmine.createSpy("markForCheck") },
        sectionsExpanded: { customUIs: true, ui_layout_1: true },
        ensureWidgetSelected: jasmine.createSpy("ensureWidgetSelected"),
        scrollToUi: jasmine.createSpy("scrollToUi"),
        isLoading: true,
        isDestroyed: false,
      };

      const res = {
        assets: [],
        themes: [{ entity_id: "t1", name: "Theme 1", is_default: true }],
        customUIs: [{ entity_id: "layout_1", name: "Layout 1" }],
        tracks: [],
      };

      applyLoadedUiEditorData(comp, res);

      expect(comp.isLoading).toBeFalse();
      expect(comp.sortAvailableColumns).toHaveBeenCalled();
      expect(comp.refreshDisplayProperties).toHaveBeenCalled();
      expect(comp.undoManager.initialize).toHaveBeenCalledWith(
        comp.editingState,
      );
      expect(comp.activeCustomUiId).toBe("layout_1");
      expect(comp.ensureWidgetSelected).toHaveBeenCalled();
      expect(comp.scrollToUi).toHaveBeenCalledWith("layout_1", 100);
      expect(comp.cdr.markForCheck).toHaveBeenCalled();
    });

    it("should handle error, initialize fallback state, alert user, and restore open layout", () => {
      spyOn(window, "alert");
      const mockSettings = new Settings();
      const comp: any = {
        logger: { error: jasmine.createSpy("error") },
        settingsService: { getSettings: () => mockSettings },
        refreshDisplayProperties: jasmine.createSpy("refreshDisplayProperties"),
        undoManager: { initialize: jasmine.createSpy("initialize") },
        cdr: { markForCheck: jasmine.createSpy("markForCheck") },
        sectionsExpanded: {},
        displayCustomUIs: [],
        isLoading: true,
        isDestroyed: false,
      };

      handleUiEditorDataLoadError(comp, new Error("network error"));

      expect(comp.logger.error).toHaveBeenCalled();
      expect(comp.isLoading).toBeFalse();
      expect(comp.editingState).toBeDefined();
      expect(comp.refreshDisplayProperties).toHaveBeenCalled();
      expect(comp.cdr.markForCheck).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith(
        "Failed to load UI layout and theme data from server.",
      );
    });

    it("should handle error and preserve existing editingState if already populated", () => {
      spyOn(window, "alert");
      const existingState: any = {
        settings: new Settings(),
        themes: [{ entity_id: "t1" }],
        customUIs: [{ entity_id: "u1" }],
      };
      const comp: any = {
        logger: { error: jasmine.createSpy("error") },
        editingState: existingState,
        refreshDisplayProperties: jasmine.createSpy("refreshDisplayProperties"),
        undoManager: { initialize: jasmine.createSpy("initialize") },
        cdr: { markForCheck: jasmine.createSpy("markForCheck") },
        sectionsExpanded: {},
        displayCustomUIs: [],
        isLoading: true,
        isDestroyed: false,
        translationService: { translate: (k: string) => `TRANS_${k}` },
      };

      handleUiEditorDataLoadError(comp, new Error("server down"));

      expect(comp.editingState).toBe(existingState);
      expect(comp.undoManager.initialize).not.toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith("TRANS_UE_ERROR_LOAD_FAILED");
    });
  });

  describe("fetchUiEditorData", () => {
    it("should fetch all editor data and propagate theme/customUi errors", (done) => {
      const mockDataService = {
        listAssets: () => of([]),
        getThemes: () => throwError(() => new Error("Theme load failure")),
        getTracks: () => of([]),
        getCustomUIs: () => of([]),
      };
      const mockFileSystem = {
        getCustomDirectoryHandle: () => of(null),
        getCustomWidgetDirectoryHandle: () => of(null),
      };

      fetchUiEditorData(mockDataService, mockFileSystem).subscribe({
        next: () => fail("Should have failed"),
        error: (err: any) => {
          expect(err.message).toBe("Theme load failure");
          done();
        },
      });
    });

    it("should fetch all editor data successfully when calls succeed", (done) => {
      const mockDataService = {
        listAssets: () => of([{ id: "a1", type: "image" }]),
        getThemes: () => of([{ entity_id: "t1" }]),
        getTracks: () => of([{ entity_id: "trk1" }]),
        getCustomUIs: () => of([{ entity_id: "u1" }]),
      };
      const mockFileSystem = {
        getCustomDirectoryHandle: () => of({ name: "dir" }),
        getCustomWidgetDirectoryHandle: () => of(null),
      };

      fetchUiEditorData(mockDataService, mockFileSystem).subscribe({
        next: (result: any) => {
          expect(result.themes.length).toBe(1);
          expect(result.customUIs.length).toBe(1);
          expect(result.dirHandle.name).toBe("dir");
          done();
        },
        error: () => fail("Should not have failed"),
      });
    });
  });

  describe("resolveBackNavigation", () => {
    it("should resolve modify-heats returnUrl or fallback", () => {
      const nav1 = resolveBackNavigation(
        { from: "modify-heats", returnUrl: "/custom-return" },
        null,
      );
      expect(nav1.targetUrl).toBe("/custom-return");
      expect(nav1.queryParams).toEqual({ modifyHeats: "true" });

      const nav2 = resolveBackNavigation({ from: "modify-heats" }, null);
      expect(nav2.targetUrl).toBe("/default-raceday");
      expect(nav2.queryParams).toEqual({ modifyHeats: "true" });
    });

    it("should resolve default setup route when from is not modify-heats", () => {
      const nav = resolveBackNavigation(() => ({ from: "setup" }), null);
      expect(nav.targetUrl).toBe("/raceday-setup");
      expect(nav.queryParams).toEqual({});
    });
  });

  describe("refreshUiEditorDisplayProperties", () => {
    it("should sort themes and custom UIs and build column slots", () => {
      const comp: any = {
        editingState: {
          themes: [
            { entity_id: "t2", name: "B" },
            { entity_id: "t1", name: "A" },
          ],
          customUIs: [
            { entity_id: "u2", name: "UI B" },
            { entity_id: "u1", name: "UI A" },
          ],
        },
        parsedLayouts: new Map(),
        displayThemes: [],
        displayCustomUIs: [],
        displayColumnSlots: [],
        availableColumns: [{ key: "col1", label: "Col 1" }],
        editingSettings: { racedayColumns: [] },
        ensureWidgetSelected: jasmine.createSpy("ensureWidgetSelected"),
        cdr: { markForCheck: jasmine.createSpy("markForCheck") },
      };

      refreshUiEditorDisplayProperties(comp);

      expect(comp.displayThemes.length).toBe(2);
      expect(comp.displayCustomUIs.length).toBe(2);
      expect(comp.ensureWidgetSelected).toHaveBeenCalled();
      expect(comp.cdr.markForCheck).toHaveBeenCalled();
    });

    it("should no-op when editingState is not present", () => {
      const comp: any = { editingState: null };
      expect(() => refreshUiEditorDisplayProperties(comp)).not.toThrow();
    });
  });

  describe("gap migration in normalizeLoadedCustomUis", () => {
    it("should migrate legacy gap widgets, columns, widths, and layouts across CustomUIs and editingSettings", () => {
      const customUis: CustomUI[] = [
        {
          entity_id: "custom_ui_gap",
          name: "Custom UI Gap",
          is_default: false,
          layoutJson: JSON.stringify({
            widgets: [
              {
                id: "w-gap",
                widgetType: "lane-column",
                customSettings: {
                  columnKey: "gapLeader",
                  insets: { "bottom-right": "gapPosition" },
                },
              },
            ],
          }),
          columnsJson: JSON.stringify(["lapCount", "gapLeader"]),
          columnLayoutsJson: JSON.stringify({
            gapLeader: {
              "center-center": "gapLeader",
              "bottom-right": "gapPosition",
            },
          }),
          columnWidthsJson: JSON.stringify({
            gapLeader: 310,
          }),
        },
      ];

      const editingSettings: any = {
        racedayLayout: {
          widgets: [
            {
              id: "w-raceday-gap",
              widgetType: "lane-column",
              customSettings: {
                columnKey: "gapLeaderF1",
              },
            },
          ],
        },
        practiceRacedayLayout: {
          widgets: [
            {
              id: "w-practice-gap",
              widgetType: "lane-column",
              customSettings: {
                columnKey: "overallGapPosition",
              },
            },
          ],
        },
        racedayColumns: ["gapLeader"],
        practiceRacedayColumns: ["gapPosition"],
        columnWidths: { gapLeader: 310 },
        practiceColumnWidths: { gapPosition: 300 },
        columnLayouts: { gapLeader: { "center-center": "gapLeader" } },
        practiceColumnLayouts: {
          gapPosition: { "center-center": "gapPosition" },
        },
      };

      normalizeLoadedCustomUis(customUis, editingSettings);

      // Check custom UI layout
      const parsedLayout = JSON.parse(customUis[0].layoutJson!);
      expect(parsedLayout.widgets[0].customSettings.columnKey).toBe("gap");
      expect(parsedLayout.widgets[0].customSettings.gapTarget).toBe("leader");
      expect(parsedLayout.widgets[0].customSettings.gapMode).toBe(
        "always_time",
      );
      expect(
        parsedLayout.widgets[0].customSettings.insets["bottom-right"],
      ).toBe("gap");
      expect(
        parsedLayout.widgets[0].customSettings.insetsConfig["bottom-right"]
          .gapTarget,
      ).toBe("position");

      // Check columns, widths, layouts
      expect(JSON.parse(customUis[0].columnsJson!)).toEqual([
        "lapCount",
        "gap",
      ]);
      expect(JSON.parse(customUis[0].columnWidthsJson!)["gap"]).toBe(310);
      expect(JSON.parse(customUis[0].columnLayoutsJson!)["gap"]).toBeDefined();

      // Check editingSettings
      expect(
        editingSettings.racedayLayout.widgets[0].customSettings.columnKey,
      ).toBe("gap");
      expect(
        editingSettings.racedayLayout.widgets[0].customSettings.gapMode,
      ).toBe("laps_and_time");
      expect(
        editingSettings.practiceRacedayLayout.widgets[0].customSettings
          .columnKey,
      ).toBe("overallGap");
      expect(
        editingSettings.practiceRacedayLayout.widgets[0].customSettings
          .gapTarget,
      ).toBe("position");
      expect(editingSettings.racedayColumns).toEqual(["gap"]);
      expect(editingSettings.practiceRacedayColumns).toEqual(["gap"]);
      expect(editingSettings.columnWidths["gap"]).toBe(310);
      expect(editingSettings.practiceColumnWidths["gap"]).toBe(300);
      expect(editingSettings.columnLayouts["gap"]).toBeDefined();
      expect(editingSettings.practiceColumnLayouts["gap"]).toBeDefined();
    });
  });
});
