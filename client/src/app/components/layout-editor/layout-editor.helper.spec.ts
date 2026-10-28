import { CustomUI } from "@app/models/custom-ui";
import { TranslationService } from "@app/services/translation.service";

import {
  areLayoutsEqual,
  buildDuplicateLayoutTemplate,
  buildLayoutSelectItems,
  buildNewLayoutTemplate,
  cloneLayout,
  getLayoutDisplayName,
  getLayoutUnsavedReasons,
  isCustomUiDefault,
  isLayoutNameUnique,
} from "./layout-editor.helper";

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
});
