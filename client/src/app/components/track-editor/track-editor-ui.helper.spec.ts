import { TrackEditorUiHelper } from "./track-editor-ui.helper";

describe("TrackEditorUiHelper", () => {
  describe("calculateScale", () => {
    it("should calculate minimum aspect ratio scale", () => {
      expect(TrackEditorUiHelper.calculateScale(1600, 900)).toBe(1);
      expect(TrackEditorUiHelper.calculateScale(800, 450)).toBe(0.5);
      expect(TrackEditorUiHelper.calculateScale(3200, 900)).toBe(1);
    });
  });

  describe("handleKeyboardEvent", () => {
    let undoSpy: jasmine.Spy;
    let redoSpy: jasmine.Spy;

    beforeEach(() => {
      undoSpy = jasmine.createSpy("undo");
      redoSpy = jasmine.createSpy("redo");
    });

    it("should do nothing if isEditMode is false", () => {
      const event = new KeyboardEvent("keydown", { key: "z", ctrlKey: true });
      TrackEditorUiHelper.handleKeyboardEvent(event, false, undoSpy, redoSpy);
      expect(undoSpy).not.toHaveBeenCalled();
      expect(redoSpy).not.toHaveBeenCalled();
    });

    it("should trigger undo on ctrl+z", () => {
      const event = new KeyboardEvent("keydown", { key: "z", ctrlKey: true });
      spyOn(event, "preventDefault");
      TrackEditorUiHelper.handleKeyboardEvent(event, true, undoSpy, redoSpy);
      expect(undoSpy).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should trigger redo on ctrl+shift+z", () => {
      const event = new KeyboardEvent("keydown", {
        key: "z",
        ctrlKey: true,
        shiftKey: true,
      });
      spyOn(event, "preventDefault");
      TrackEditorUiHelper.handleKeyboardEvent(event, true, undoSpy, redoSpy);
      expect(redoSpy).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });

    it("should trigger redo on ctrl+y", () => {
      const event = new KeyboardEvent("keydown", { key: "y", ctrlKey: true });
      spyOn(event, "preventDefault");
      TrackEditorUiHelper.handleKeyboardEvent(event, true, undoSpy, redoSpy);
      expect(redoSpy).toHaveBeenCalled();
      expect(event.preventDefault).toHaveBeenCalled();
    });
  });

  describe("sections storage and toggling", () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it("should return defaults when nothing in localStorage", () => {
      const sections = TrackEditorUiHelper.loadSavedSections();
      expect(sections).toEqual({
        general: true,
        interfaces: true,
        lanes: true,
      });
    });

    it("should toggle specific section and persist", () => {
      const initial = { general: true, interfaces: true, lanes: true };
      const toggled = TrackEditorUiHelper.toggleSection(initial, "lanes");
      expect(toggled.lanes).toBeFalse();
      expect(localStorage.getItem("rc.track-editor.sections")).toContain(
        '"lanes":false',
      );
    });

    it("should toggle all sections", () => {
      const initial = { general: true, interfaces: true, lanes: true };
      const res = TrackEditorUiHelper.toggleAllSections(initial);
      expect(res.nextState).toBeFalse();
      expect(res.sections.general).toBeFalse();
      expect(res.sections.lanes).toBeFalse();
      expect(res.sections.interfaces).toBeFalse();
    });
  });
});
