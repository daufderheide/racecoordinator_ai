import {
  RaceEditorSections,
  RaceEditorUiHelper,
} from "./race-editor-ui.helper";

describe("RaceEditorUiHelper", () => {
  let defaultSections: RaceEditorSections;

  beforeEach(() => {
    defaultSections = {
      general: true,
      start_method: true,
      scoring: true,
      season_points: true,
      heats: true,
      groups: true,
      fuel_analog: true,
      fuel_digital: true,
      team: true,
    };
    localStorage.clear();
  });

  describe("calculateScale", () => {
    it("should compute scale ratio correctly based on 1600x900", () => {
      expect(RaceEditorUiHelper.calculateScale(1600, 900)).toBe(1);
      expect(RaceEditorUiHelper.calculateScale(800, 450)).toBe(0.5);
      expect(RaceEditorUiHelper.calculateScale(3200, 1800)).toBe(2);
    });

    it("should fallback to 1 if calculated scale is <= 0 or NaN", () => {
      expect(RaceEditorUiHelper.calculateScale(0, 0)).toBe(1);
      expect(RaceEditorUiHelper.calculateScale(NaN, NaN)).toBe(1);
    });
  });

  describe("handleKeyboardEvent", () => {
    it("should trigger undo on Ctrl+Z / Meta+Z", () => {
      const undoSpy = jasmine.createSpy("undo");
      const redoSpy = jasmine.createSpy("redo");
      const event = new KeyboardEvent("keydown", { key: "z", ctrlKey: true });
      spyOn(event, "preventDefault");

      RaceEditorUiHelper.handleKeyboardEvent(event, true, undoSpy, redoSpy);
      expect(undoSpy).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should trigger redo on Ctrl+Shift+Z or Ctrl+Y", () => {
      const undoSpy = jasmine.createSpy("undo");
      const redoSpy = jasmine.createSpy("redo");
      const event1 = new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        shiftKey: true,
      });
      spyOn(event1, "preventDefault");

      RaceEditorUiHelper.handleKeyboardEvent(event1, true, undoSpy, redoSpy);
      expect(redoSpy).toHaveBeenCalledTimes(1);

      const event2 = new KeyboardEvent("keydown", { key: "y", metaKey: true });
      spyOn(event2, "preventDefault");

      RaceEditorUiHelper.handleKeyboardEvent(event2, true, undoSpy, redoSpy);
      expect(redoSpy).toHaveBeenCalledTimes(2);
    });

    it("should do nothing if not in edit mode", () => {
      const undoSpy = jasmine.createSpy("undo");
      const redoSpy = jasmine.createSpy("redo");
      const event = new KeyboardEvent("keydown", { key: "z", ctrlKey: true });

      RaceEditorUiHelper.handleKeyboardEvent(event, false, undoSpy, redoSpy);
      expect(undoSpy).not.toHaveBeenCalled();
    });
  });

  describe("LocalStorage persistence", () => {
    it("should load and save expander state, migrating legacy fuel property", () => {
      localStorage.setItem(
        "race_editor_expanders",
        JSON.stringify({ fuel: false, general: false }),
      );
      const loaded = RaceEditorUiHelper.loadExpanderState(defaultSections);
      expect(loaded.general).toBeFalse();
      expect(loaded.fuel_analog).toBeFalse();
      expect(loaded.fuel_digital).toBeFalse();

      loaded.general = true;
      RaceEditorUiHelper.saveExpanderState(loaded);
      expect(localStorage.getItem("race_editor_expanders")).toContain(
        '"general":true',
      );
    });

    it("should load and save driver count with fallback", () => {
      expect(RaceEditorUiHelper.loadDriverCount()).toBe(4);

      RaceEditorUiHelper.saveDriverCount(8);
      expect(RaceEditorUiHelper.loadDriverCount()).toBe(8);

      localStorage.setItem("race_editor_driver_count", "invalid");
      expect(RaceEditorUiHelper.loadDriverCount()).toBe(4);
    });
  });

  describe("scrollToAndExpandSection", () => {
    it("should expand section and save to localStorage", () => {
      defaultSections.general = false;
      RaceEditorUiHelper.scrollToAndExpandSection(
        "general-section",
        defaultSections,
      );
      expect(defaultSections.general).toBeTrue();
      expect(localStorage.getItem("race_editor_expanders")).toContain(
        '"general":true',
      );
    });
  });
});
