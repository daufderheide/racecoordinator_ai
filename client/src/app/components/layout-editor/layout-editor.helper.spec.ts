import { CustomUI } from "@app/models/custom-ui";
import { NavigationService } from "@app/services/navigation.service";
import { TranslationService } from "@app/services/translation.service";

import {
  areLayoutsEqual,
  buildDuplicateLayoutTemplate,
  buildLayoutSelectItems,
  buildLayoutTemplateOptions,
  buildNewLayoutTemplate,
  clearLastEditedLayoutId,
  cloneLayout,
  createFallbackDefaultLayouts,
  getLastEditedLayoutId,
  getLayoutDisplayName,
  getLayoutUnsavedReasons,
  isCustomUiDefault,
  isLayoutNameUnique,
  LAYOUT_AVAILABLE_COLUMNS,
  LAYOUT_LAST_EDITED_STORAGE_KEY,
  resolveInitialLayout,
  resolveTemplateSource,
  setLastEditedLayoutId,
  syncLayoutSettingsWithDefaults,
} from "./layout-editor.helper";
import { onWidgetScaleModeChange } from "./layout-editor-actions.helper";

describe("layout-editor.helper", () => {
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  beforeEach(() => {
    mockTranslationService = jasmine.createSpyObj<TranslationService>(
      "TranslationService",
      ["translate"],
    );
    mockTranslationService.translate.and.callFake((key: string) => {
      if (key === "UE_LABEL_DEFAULT_RACEDAY_UI") return "Default Raceday UI";
      if (key === "UE_LABEL_DEFAULT_PRACTICE_UI") return "Default Practice UI";
      if (key === "LE_ERROR_NAME_INVALID") return "Name invalid";
      if (key === "LE_LAYOUT_NAME") return "Layout Name";
      return key;
    });
  });

  describe("areLayoutsEqual", () => {
    it("should return true for identical references and objects", () => {
      const u1: CustomUI = {
        entity_id: "layout1",
        name: "Layout 1",
        is_default: false,
        layoutJson: "{}",
      };
      expect(areLayoutsEqual(u1, u1)).toBeTrue();
      expect(areLayoutsEqual(u1, { ...u1 })).toBeTrue();
    });

    it("should return false if either object is null or undefined", () => {
      const u1: CustomUI = {
        entity_id: "layout1",
        name: "Layout 1",
        is_default: false,
      };
      expect(areLayoutsEqual(u1, null)).toBeFalse();
      expect(areLayoutsEqual(undefined, u1)).toBeFalse();
      expect(areLayoutsEqual(null, null)).toBeTrue();
    });

    it("should return false if name, entity_id, or layoutJson differs", () => {
      const u1: CustomUI = {
        entity_id: "layout1",
        name: "Layout 1",
        is_default: false,
        layoutJson: "{}",
      };
      expect(areLayoutsEqual(u1, { ...u1, name: "Layout 2" })).toBeFalse();
      expect(areLayoutsEqual(u1, { ...u1, entity_id: "layout2" })).toBeFalse();
      expect(
        areLayoutsEqual(u1, { ...u1, layoutJson: '{"widgets":[]}' }),
      ).toBeFalse();
      expect(
        areLayoutsEqual(u1, { ...u1, columnsJson: '["driver.name"]' }),
      ).toBeFalse();
    });
  });

  describe("cloneLayout", () => {
    it("should create a deep copy of a CustomUI", () => {
      const original: CustomUI = {
        entity_id: "orig",
        name: "Original",
        is_default: false,
        layoutJson: JSON.stringify({ widgets: [{ id: "w1" }] }),
      };
      const copy = cloneLayout(original);
      expect(copy).toEqual(original);
      expect(copy).not.toBe(original);
      copy.name = "Modified";
      expect(original.name).toBe("Original");
    });
  });

  describe("isLayoutNameUnique", () => {
    const list: CustomUI[] = [
      { entity_id: "l1", name: "Grand Prix", is_default: false },
      { entity_id: "l2", name: "Sprint", is_default: false },
    ];

    it("should return true for unique name", () => {
      expect(isLayoutNameUnique("Endurance", undefined, list)).toBeTrue();
    });

    it("should return true when name matches self", () => {
      expect(isLayoutNameUnique("Grand Prix", "l1", list)).toBeTrue();
    });

    it("should return false when name matches another layout case-insensitively", () => {
      expect(isLayoutNameUnique("grand prix", "l2", list)).toBeFalse();
      expect(isLayoutNameUnique("SPRINT", undefined, list)).toBeFalse();
    });

    it("should return false for empty or whitespace-only name", () => {
      expect(isLayoutNameUnique("", undefined, list)).toBeFalse();
      expect(isLayoutNameUnique("   ", undefined, list)).toBeFalse();
      expect(isLayoutNameUnique(null, undefined, list)).toBeFalse();
    });
  });

  describe("getLayoutDisplayName and buildLayoutSelectItems", () => {
    it("should localize built-in layout names", () => {
      const defaultUi: CustomUI = {
        entity_id: "default_ui_layout_rc_ai",
        name: "default",
        is_default: true,
      };
      const name = getLayoutDisplayName(defaultUi, mockTranslationService);
      expect(name).toBe("Default Raceday UI");
    });

    it("should return custom name for custom layouts", () => {
      const customUi: CustomUI = {
        entity_id: "c1",
        name: "My Custom Grid",
        is_default: false,
      };
      const name = getLayoutDisplayName(customUi, mockTranslationService);
      expect(name).toBe("My Custom Grid");
    });

    it("buildLayoutSelectItems should return sorted select items", () => {
      const items = buildLayoutSelectItems(
        [
          { entity_id: "c2", name: "Zebra Layout", is_default: false },
          { entity_id: "c1", name: "Alpha Layout", is_default: false },
        ],
        mockTranslationService,
      );
      expect(items.length).toBe(2);
      expect(items[0].name).toBe("Alpha Layout");
      expect(items[1].name).toBe("Zebra Layout");
    });

    it("buildLayoutSelectItems should return empty array for empty collection", () => {
      expect(buildLayoutSelectItems(null)).toEqual([]);
      expect(buildLayoutSelectItems([])).toEqual([]);
    });
  });

  describe("buildNewLayoutTemplate and buildDuplicateLayoutTemplate", () => {
    it("should build new template with unique name and reset data", () => {
      const existing: CustomUI[] = [
        { entity_id: "l1", name: "New UI Layout", is_default: false },
      ];
      const template = buildNewLayoutTemplate("New UI Layout", existing);
      expect(template.entity_id).toBe("new");
      expect(template.is_default).toBeFalse();
      expect(template.name).not.toBe("New UI Layout");
      expect(template.layoutJson).toBeDefined();
    });

    it("should build empty new layout template with empty widgets", () => {
      const existing: CustomUI[] = [];
      const template = buildNewLayoutTemplate(
        "New UI Layout",
        existing,
        "empty",
      );
      expect(template.entity_id).toBe("new");
      expect(template.is_default).toBeFalse();
      const layout = JSON.parse(template.layoutJson || "{}");
      expect(layout.widgets).toEqual([]);
    });

    it("should build new layout template from custom template source", () => {
      const existing: CustomUI[] = [];
      const source: CustomUI = {
        entity_id: "src1",
        name: "Custom Source",
        is_default: false,
        layoutJson: JSON.stringify({ widgets: [{ id: "custom_w" }] }),
        columnsJson: '["col1"]',
        columnLayoutsJson: '{"col1":{}}',
      };
      const template = buildNewLayoutTemplate(
        "New UI Layout",
        existing,
        source,
      );
      expect(template.entity_id).toBe("new");
      expect(template.layoutJson).toBe(source.layoutJson);
      expect(template.columnsJson).toBe('["col1"]');
    });

    it("should duplicate existing layout with unique name", () => {
      const source: CustomUI = {
        entity_id: "src",
        name: "Main Display",
        is_default: true,
        layoutJson: '{"widgets":[]}',
      };
      const copy = buildDuplicateLayoutTemplate(source, [source]);
      expect(copy.entity_id).toBe("new");
      expect(copy.is_default).toBeFalse();
      expect(copy.name).toContain("Main Display Copy");
      expect(copy.layoutJson).toBe('{"widgets":[]}');
    });
  });

  describe("buildLayoutTemplateOptions and resolveTemplateSource", () => {
    it("should build template options with 4 defaults and empty option", () => {
      const allLayouts: CustomUI[] = [
        {
          entity_id: "default_ui_layout_rc_ai",
          name: "RaceCoordinator AI",
          is_default: true,
        },
        {
          entity_id: "practice_ui_layout_rc_ai",
          name: "RaceCoordinator AI (Practice)",
          is_default: true,
        },
        {
          entity_id: "default_fuel_ui_layout_rc_ai",
          name: "RaceCoordinator AI (Fuel)",
          is_default: true,
        },
        {
          entity_id: "driver_station_ui_layout_rc_ai",
          name: "Driver Station",
          is_default: true,
        },
      ];
      mockTranslationService.translate.and.callFake((key: string) => {
        if (key === "LE_TEMPLATE_EMPTY") return "Empty Layout";
        return key;
      });
      const options = buildLayoutTemplateOptions(
        allLayouts,
        mockTranslationService,
      );
      expect(options.length).toBe(5);
      expect(options[0].id).toBe("default_ui_layout_rc_ai");
      expect(options[1].id).toBe("practice_ui_layout_rc_ai");
      expect(options[2].id).toBe("default_fuel_ui_layout_rc_ai");
      expect(options[3].id).toBe("driver_station_ui_layout_rc_ai");
      expect(options[4].id).toBe("empty");
      expect(options[4].name).toBe("Empty Layout");
    });

    it("should resolve template source for empty and specific IDs", () => {
      const allLayouts: CustomUI[] = [
        {
          entity_id: "default_ui_layout_rc_ai",
          name: "RaceCoordinator AI",
          is_default: true,
        },
        {
          entity_id: "practice_ui_layout_rc_ai",
          name: "Practice",
          is_default: true,
        },
      ];
      expect(resolveTemplateSource("empty", allLayouts)).toBe("empty");
      expect(
        resolveTemplateSource("practice_ui_layout_rc_ai", allLayouts),
      ).toBe(allLayouts[1]);
      expect(resolveTemplateSource(undefined, allLayouts)).toBe(allLayouts[0]);

      // Fallbacks when not in allLayouts
      const fallbackPractice = resolveTemplateSource(
        "practice_ui_layout_rc_ai",
        [],
      );
      expect(fallbackPractice).not.toBeNull();
      expect((fallbackPractice as CustomUI).entity_id).toBe(
        "practice_ui_layout_rc_ai",
      );

      const fallbackDs = resolveTemplateSource(
        "driver_station_ui_layout_rc_ai",
        [],
      );
      expect(fallbackDs).not.toBeNull();
      expect((fallbackDs as CustomUI).entity_id).toBe(
        "driver_station_ui_layout_rc_ai",
      );

      const fallbackFuel = resolveTemplateSource(
        "default_fuel_ui_layout_rc_ai",
        [],
      );
      expect(fallbackFuel).not.toBeNull();
      expect((fallbackFuel as CustomUI).entity_id).toBe(
        "default_fuel_ui_layout_rc_ai",
      );
    });

    it("should include 4 default layouts in createFallbackDefaultLayouts", () => {
      const fallbacks = createFallbackDefaultLayouts();
      expect(fallbacks.length).toBe(4);
      expect(
        fallbacks.some((u) => u.entity_id === "default_ui_layout_rc_ai"),
      ).toBeTrue();
      expect(
        fallbacks.some((u) => u.entity_id === "practice_ui_layout_rc_ai"),
      ).toBeTrue();
      expect(
        fallbacks.some((u) => u.entity_id === "default_fuel_ui_layout_rc_ai"),
      ).toBeTrue();
      expect(
        fallbacks.some((u) => u.entity_id === "driver_station_ui_layout_rc_ai"),
      ).toBeTrue();
    });
  });

  describe("getLayoutUnsavedReasons", () => {
    it("should report empty or duplicate names", () => {
      const original: CustomUI = {
        entity_id: "orig",
        name: "Original",
        is_default: false,
      };
      const editing: CustomUI = {
        entity_id: "orig",
        name: "",
        is_default: false,
      };
      const reasons = getLayoutUnsavedReasons(
        editing,
        original,
        [original],
        mockTranslationService,
      );
      expect(reasons.length).toBeGreaterThan(0);
    });

    it("should report modified name and layoutJson", () => {
      const original: CustomUI = {
        entity_id: "orig",
        name: "Original",
        is_default: false,
        layoutJson: "{}",
      };
      const editing: CustomUI = {
        entity_id: "orig",
        name: "Renamed",
        is_default: false,
        layoutJson: '{"widgets":[]}',
      };
      const reasons = getLayoutUnsavedReasons(
        editing,
        original,
        [original],
        mockTranslationService,
      );
      expect(reasons).toContain("Layout Name");
    });
  });

  describe("isCustomUiDefault", () => {
    it("should identify default layouts by ID or flag", () => {
      expect(
        isCustomUiDefault({
          entity_id: "default_ui_layout_rc_ai",
          name: "d",
          is_default: false,
        }),
      ).toBeTrue();
      expect(
        isCustomUiDefault({
          entity_id: "practice_ui_layout_rc_ai",
          name: "p",
          is_default: false,
        }),
      ).toBeTrue();
      expect(
        isCustomUiDefault({
          entity_id: "custom_1",
          name: "c",
          is_default: true,
        }),
      ).toBeTrue();
      expect(
        isCustomUiDefault({
          entity_id: "custom_1",
          name: "c",
          is_default: false,
        }),
      ).toBeFalse();
    });
  });

  describe("LAYOUT_AVAILABLE_COLUMNS", () => {
    it("should include lastLaps and comprehensive column definitions", () => {
      expect(
        LAYOUT_AVAILABLE_COLUMNS.some((c) => c.key === "lastLaps"),
      ).toBeTrue();
      expect(
        LAYOUT_AVAILABLE_COLUMNS.some((c) => c.key === "lastLapTime"),
      ).toBeTrue();
      expect(
        LAYOUT_AVAILABLE_COLUMNS.some((c) => c.key === "bestLapTime"),
      ).toBeTrue();
      expect(
        LAYOUT_AVAILABLE_COLUMNS.some((c) => c.key === "driver.name"),
      ).toBeTrue();
      expect(LAYOUT_AVAILABLE_COLUMNS.length).toBeGreaterThan(20);
    });
  });

  describe("resolveInitialLayout", () => {
    const l1: CustomUI = {
      entity_id: "layout_1",
      name: "Layout 1",
      is_default: false,
    };
    const l2: CustomUI = {
      entity_id: "layout_2",
      name: "Layout 2",
      is_default: false,
    };
    const l3: CustomUI = {
      entity_id: "layout_3",
      name: "Layout 3",
      is_default: false,
    };
    const layouts = [l1, l2, l3];

    it("should return null for empty or null layouts array", () => {
      expect(resolveInitialLayout("layout_1", [])).toBeNull();
      expect(resolveInitialLayout(undefined, [] as any)).toBeNull();
    });

    it("should select layout matching paramsId first", () => {
      const result = resolveInitialLayout("layout_2", layouts, "layout_3");
      expect(result).toBe(l2);
    });

    it("should fallback to lastEditedId when paramsId does not match any layout", () => {
      const result = resolveInitialLayout("non_existent", layouts, "layout_3");
      expect(result).toBe(l3);
    });

    it("should select lastEditedId when paramsId is omitted", () => {
      const result = resolveInitialLayout(undefined, layouts, "layout_2");
      expect(result).toBe(l2);
    });

    it("should fallback to first layout when neither paramsId nor lastEditedId match", () => {
      const result = resolveInitialLayout(undefined, layouts, "non_existent");
      expect(result).toBe(l1);
    });

    it("should fallback to first layout when paramsId and lastEditedId are not provided", () => {
      const result = resolveInitialLayout(undefined, layouts, undefined);
      expect(result).toBe(l1);
    });
  });

  describe("getLastEditedLayoutId / setLastEditedLayoutId / clearLastEditedLayoutId", () => {
    let mockNav: jasmine.SpyObj<NavigationService>;

    beforeEach(() => {
      localStorage.removeItem(LAYOUT_LAST_EDITED_STORAGE_KEY);
      mockNav = jasmine.createSpyObj<NavigationService>("NavigationService", [
        "getLastEditedId",
        "setLastEditedId",
        "clearLastEditedId",
      ]);
    });

    afterEach(() => {
      localStorage.removeItem(LAYOUT_LAST_EDITED_STORAGE_KEY);
    });

    it("should retrieve ID from NavigationService if available", () => {
      mockNav.getLastEditedId.and.returnValue("layout_from_nav");
      expect(getLastEditedLayoutId(mockNav)).toBe("layout_from_nav");
      expect(mockNav.getLastEditedId).toHaveBeenCalledWith("layout");
    });

    it("should fallback to localStorage if NavigationService returns null", () => {
      mockNav.getLastEditedId.and.returnValue(null);
      localStorage.setItem(
        LAYOUT_LAST_EDITED_STORAGE_KEY,
        "layout_from_storage",
      );
      expect(getLastEditedLayoutId(mockNav)).toBe("layout_from_storage");
    });

    it("should retrieve ID from localStorage when NavigationService is null", () => {
      localStorage.setItem(
        LAYOUT_LAST_EDITED_STORAGE_KEY,
        "layout_from_storage_direct",
      );
      expect(getLastEditedLayoutId(null)).toBe("layout_from_storage_direct");
    });

    it("should return null if neither NavigationService nor localStorage has an ID", () => {
      mockNav.getLastEditedId.and.returnValue(null);
      expect(getLastEditedLayoutId(mockNav)).toBeNull();
      expect(getLastEditedLayoutId(null)).toBeNull();
    });

    it("should set ID in NavigationService and localStorage", () => {
      setLastEditedLayoutId("layout_42", mockNav);
      expect(mockNav.setLastEditedId).toHaveBeenCalledWith(
        "layout",
        "layout_42",
      );
      expect(localStorage.getItem(LAYOUT_LAST_EDITED_STORAGE_KEY)).toBe(
        "layout_42",
      );
    });

    it("should not set ID if ID is empty", () => {
      setLastEditedLayoutId("", mockNav);
      expect(mockNav.setLastEditedId).not.toHaveBeenCalled();
      expect(localStorage.getItem(LAYOUT_LAST_EDITED_STORAGE_KEY)).toBeNull();
    });

    it("should clear ID in NavigationService and localStorage", () => {
      localStorage.setItem(LAYOUT_LAST_EDITED_STORAGE_KEY, "layout_to_clear");
      clearLastEditedLayoutId(mockNav);
      expect(mockNav.clearLastEditedId).toHaveBeenCalledWith("layout");
      expect(localStorage.getItem(LAYOUT_LAST_EDITED_STORAGE_KEY)).toBeNull();
    });

    it("should gracefully handle localStorage errors when reading", () => {
      mockNav.getLastEditedId.and.returnValue(null);
      spyOn(localStorage, "getItem").and.throwError("Storage error");
      expect(getLastEditedLayoutId(mockNav)).toBeNull();
    });

    it("should gracefully handle localStorage errors when writing", () => {
      const spy = spyOn(localStorage, "setItem").and.throwError("Storage full");
      expect(() => setLastEditedLayoutId("layout_err", mockNav)).not.toThrow();
      expect(mockNav.setLastEditedId).toHaveBeenCalledWith(
        "layout",
        "layout_err",
      );
      spy.and.callThrough();
    });

    it("should gracefully handle localStorage errors when clearing", () => {
      const spy = spyOn(localStorage, "removeItem").and.throwError(
        "Storage error",
      );
      expect(() => clearLastEditedLayoutId(mockNav)).not.toThrow();
      expect(mockNav.clearLastEditedId).toHaveBeenCalledWith("layout");
      spy.and.callThrough();
    });
  });

  describe("syncLayoutSettingsWithDefaults", () => {
    it("should populate layoutJson when defaultUi layoutJson is empty or uninitialized", () => {
      const layouts: CustomUI[] = [
        {
          entity_id: "default_ui_layout_rc_ai",
          name: "Default",
          is_default: true,
        },
        {
          entity_id: "practice_ui_layout_rc_ai",
          name: "Practice",
          is_default: true,
        },
      ];
      const raceday = { widgets: [{ id: "w1" }] } as any;
      const practice = { widgets: [{ id: "w2" }] } as any;

      syncLayoutSettingsWithDefaults(layouts, raceday, practice);

      expect(layouts[0].layoutJson).toBe(JSON.stringify(raceday));
      expect(layouts[1].layoutJson).toBe(JSON.stringify(practice));
    });

    it("should preserve existing non-empty layoutJson and not overwrite with defaults", () => {
      const customRacedayJson = JSON.stringify({
        widgets: [
          {
            id: "custom-w1",
            customSettings: { lastLapsShowBorder: true, lastLapsCount: 8 },
          },
        ],
      });
      const customPracticeJson = JSON.stringify({
        widgets: [
          {
            id: "custom-w2",
            customSettings: { lastLapsCount: 12 },
          },
        ],
      });
      const layouts: CustomUI[] = [
        {
          entity_id: "default_ui_layout_rc_ai",
          name: "Default",
          is_default: true,
          layoutJson: customRacedayJson,
        },
        {
          entity_id: "practice_ui_layout_rc_ai",
          name: "Practice",
          is_default: true,
          layoutJson: customPracticeJson,
        },
      ];
      const raceday = { widgets: [{ id: "default-w1" }] } as any;
      const practice = { widgets: [{ id: "default-w2" }] } as any;

      syncLayoutSettingsWithDefaults(layouts, raceday, practice);

      expect(layouts[0].layoutJson).toBe(customRacedayJson);
      expect(layouts[1].layoutJson).toBe(customPracticeJson);
    });

    it("should populate layoutJson when layoutJson is '{}' or '[]'", () => {
      const layouts: CustomUI[] = [
        {
          entity_id: "default_ui_layout_rc_ai",
          name: "Default",
          is_default: true,
          layoutJson: "{}",
        },
        {
          entity_id: "practice_ui_layout_rc_ai",
          name: "Practice",
          is_default: true,
          layoutJson: "[]",
        },
      ];
      const raceday = { widgets: [{ id: "w1" }] } as any;
      const practice = { widgets: [{ id: "w2" }] } as any;

      syncLayoutSettingsWithDefaults(layouts, raceday, practice);

      expect(layouts[0].layoutJson).toBe(JSON.stringify(raceday));
      expect(layouts[1].layoutJson).toBe(JSON.stringify(practice));
    });

    it("should do nothing if racedayLayout or practiceRacedayLayout have no widgets", () => {
      const layouts: CustomUI[] = [
        {
          entity_id: "default_ui_layout_rc_ai",
          name: "Default",
          is_default: true,
        },
        {
          entity_id: "practice_ui_layout_rc_ai",
          name: "Practice",
          is_default: true,
        },
      ];

      syncLayoutSettingsWithDefaults(layouts, undefined, {
        widgets: [],
      } as any);

      expect(layouts[0].layoutJson).toBeUndefined();
      expect(layouts[1].layoutJson).toBeUndefined();
    });
  });

  describe("onWidgetScaleModeChange", () => {
    it("should do nothing if widget is falsy", () => {
      const mockComp = {
        getLayout: jasmine.createSpy("getLayout"),
        captureState: jasmine.createSpy("captureState"),
        cdr: { markForCheck: jasmine.createSpy("markForCheck") },
      };
      const ui: CustomUI = {
        entity_id: "u1",
        name: "UI 1",
        is_default: false,
        layoutJson: "{}",
      };
      expect(() =>
        onWidgetScaleModeChange("", null as any, ui, mockComp),
      ).not.toThrow();
      expect(mockComp.getLayout).not.toHaveBeenCalled();
    });

    it("should update scaleMode to custom and apply default settings", () => {
      const widget = {
        id: "w-race",
        widgetType: "race-name",
        scaleMode: "auto",
      };
      const layout = {
        widgets: [{ ...widget }],
      };
      const ui: CustomUI = {
        entity_id: "u1",
        name: "UI 1",
        is_default: false,
        layoutJson: JSON.stringify(layout),
      };
      const mockComp = {
        getLayout: jasmine.createSpy("getLayout").and.returnValue(layout),
        syncRacedayPreview: jasmine.createSpy("syncRacedayPreview"),
        captureState: jasmine.createSpy("captureState"),
        cdr: { markForCheck: jasmine.createSpy("markForCheck") },
        editingSettings: {},
      };

      onWidgetScaleModeChange("", widget, ui, mockComp);

      const savedLayout = JSON.parse(ui.layoutJson!);
      expect(savedLayout.widgets[0].scaleMode).toBe("");
      expect(savedLayout.widgets[0].customSettings?.labelFontSize).toBe(13);
      expect(savedLayout.widgets[0].customSettings?.valueFontSize).toBe(18);
      expect(mockComp.syncRacedayPreview).toHaveBeenCalled();
      expect(mockComp.captureState).toHaveBeenCalled();
      expect(mockComp.cdr.markForCheck).toHaveBeenCalled();
    });
  });
});
