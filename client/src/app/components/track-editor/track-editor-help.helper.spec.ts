import { QueryList } from "@angular/core";

import { TrackEditorHelpHelper } from "./track-editor-help.helper";

describe("TrackEditorHelpHelper", () => {
  let mockTranslationService: any;

  beforeEach(() => {
    mockTranslationService = {
      translate: jasmine
        .createSpy("translate")
        .and.callFake((key: string) => key),
    };
  });

  describe("getBaseHelpSteps", () => {
    it("should return the standard 12 base help steps", () => {
      const steps = TrackEditorHelpHelper.getBaseHelpSteps(
        mockTranslationService,
      );
      expect(steps.length).toBe(12);
      expect(steps[0].title).toBe("TE_HELP_WELCOME_TITLE");
      expect(steps[2].selector).toBe("#track-name-input");
      expect(steps[11].selector).toBe("#add-interface-btn");
    });
  });

  describe("getInterfaceHelpSteps", () => {
    it("should return empty array if no interface configs", () => {
      const steps = TrackEditorHelpHelper.getInterfaceHelpSteps({}, {});
      expect(steps).toEqual([]);
    });

    it("should include help steps from configured interfaces", () => {
      const mockArduinoEditor = {
        getHelpSteps: jasmine
          .createSpy("getHelpSteps")
          .and.returnValue([{ title: "ARDUINO_STEP" }]),
      };
      const mockBartEditor = {
        getHelpSteps: jasmine
          .createSpy("getHelpSteps")
          .and.returnValue([{ title: "BART_STEP" }]),
      };
      const mockPhidgetEditor = {
        getHelpSteps: jasmine
          .createSpy("getHelpSteps")
          .and.returnValue([{ title: "PHIDGET_STEP" }]),
      };
      const mockTrackmateEditor = {
        getHelpSteps: jasmine
          .createSpy("getHelpSteps")
          .and.returnValue([{ title: "TM_STEP" }]),
      };

      const editors = {
        arduinoEditors: {
          first: mockArduinoEditor,
        } as unknown as QueryList<any>,
        bartEditors: { first: mockBartEditor } as unknown as QueryList<any>,
        phidgetEditors: {
          first: mockPhidgetEditor,
        } as unknown as QueryList<any>,
        trakmateEditors: {
          first: mockTrackmateEditor,
        } as unknown as QueryList<any>,
      };

      const configs = {
        arduinoConfigs: [{ name: "A1" } as any],
        bartConfigs: [{ name: "B1" } as any],
        phidgetConfigs: [{ name: "P1" } as any],
        trackmateConfigs: [{ name: "TM1" } as any],
      };

      const steps = TrackEditorHelpHelper.getInterfaceHelpSteps(
        editors,
        configs,
      );
      expect(steps.length).toBe(4);
      expect(steps[0].title).toBe("ARDUINO_STEP");
      expect(steps[1].title).toBe("BART_STEP");
      expect(steps[2].title).toBe("PHIDGET_STEP");
      expect(steps[3].title).toBe("TM_STEP");
    });
  });

  describe("getHelpSteps", () => {
    it("should combine base and interface steps", () => {
      const allSteps = TrackEditorHelpHelper.getHelpSteps(
        mockTranslationService,
        {},
        {},
      );
      expect(allSteps.length).toBe(12);
    });
  });

  describe("getToolbarHelpSteps", () => {
    it("should return the 6 toolbar guide steps", () => {
      const toolbarSteps = TrackEditorHelpHelper.getToolbarHelpSteps(
        mockTranslationService,
      );
      expect(toolbarSteps.length).toBe(6);
      expect(toolbarSteps.map((s) => s.targetId)).toEqual([
        "undo-btn",
        "redo-btn",
        "edit-track-btn",
        "expand-collapse-all-btn",
        "copy-item-btn",
        "help-track-btn",
      ]);
    });
  });

  describe("ensureSectionsExpandedForHelp", () => {
    it("should expand lanes and interfaces sections if collapsed", () => {
      const sections = { general: true, interfaces: false, lanes: false };
      const changed = TrackEditorHelpHelper.ensureSectionsExpandedForHelp(
        sections,
        true,
        {},
        {},
      );

      expect(changed).toBeTrue();
      expect(sections.lanes).toBeTrue();
      expect(sections.interfaces).toBeTrue();
    });

    it("should trigger ensureSectionsExpanded on child editors", () => {
      const mockArduino = { ensureSectionsExpanded: jasmine.createSpy() };
      const mockBart = { ensureSectionsExpanded: jasmine.createSpy() };
      const mockPhidget = { ensureSectionsExpanded: jasmine.createSpy() };
      const mockTm = { ensureSectionsExpanded: jasmine.createSpy() };

      const sections = { general: true, interfaces: true, lanes: true };
      const editors = {
        arduinoEditors: { first: mockArduino } as any,
        bartEditors: { first: mockBart } as any,
        phidgetEditors: { first: mockPhidget } as any,
        trakmateEditors: { first: mockTm } as any,
      };
      const configs = {
        arduinoConfigs: [{}] as any,
        bartConfigs: [{}] as any,
        phidgetConfigs: [{}] as any,
        trackmateConfigs: [{}] as any,
      };

      const changed = TrackEditorHelpHelper.ensureSectionsExpandedForHelp(
        sections,
        true,
        editors,
        configs,
      );

      expect(changed).toBeFalse();
      expect(mockArduino.ensureSectionsExpanded).toHaveBeenCalled();
      expect(mockBart.ensureSectionsExpanded).toHaveBeenCalled();
      expect(mockPhidget.ensureSectionsExpanded).toHaveBeenCalled();
      expect(mockTm.ensureSectionsExpanded).toHaveBeenCalled();
    });
  });
});
