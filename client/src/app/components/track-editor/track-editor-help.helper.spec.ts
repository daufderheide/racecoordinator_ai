import { QueryList } from "@angular/core";
import { GuideStepTestHelper } from "@app/testing/guide-step-test.helper";

import enJson from "../../../assets/i18n/en.json";
import { TrackEditorHelpHelper } from "./track-editor-help.helper";

describe("TrackEditorHelpHelper", () => {
  let mockTranslationService: any;

  beforeEach(() => {
    mockTranslationService = {
      translate: jasmine
        .createSpy("translate")
        .and.callFake((key: string) => `translated_${key}`),
    };
  });

  describe("getBaseHelpSteps", () => {
    it("should return the standard 6 base help steps in expected order", () => {
      const sections = { general: true, interfaces: false, lanes: false };
      const steps = TrackEditorHelpHelper.getBaseHelpSteps(
        mockTranslationService,
        sections,
      );
      expect(steps.length).toBe(6);

      // Step 0: Overview (General info)
      expect(steps[0].title).toBe("translated_TE_HELP_WELCOME_TITLE");
      expect(steps[0].content).toBe("translated_TE_HELP_WELCOME_CONTENT");
      expect(steps[0].position).toBe("center");
      expect(steps[0].targetId).toBeUndefined();
      expect(steps[0].selector).toBeUndefined();

      // Step 1: Select track nav
      expect(steps[1].targetId).toBe("editor-object-nav");
      expect(steps[1].selector).toBe("#editor-object-nav");
      expect(steps[1].title).toBe("translated_TE_HELP_SELECTOR_TITLE");
      expect(steps[1].content).toBe("translated_TE_HELP_SELECTOR_CONTENT");
      expect(steps[1].position).toBe("bottom");

      // Step 2: Toolbar (pointing at edit button, highlighting toolbar container)
      expect(steps[2].targetId).toBe("edit-track-btn");
      expect(steps[2].highlightTargetId).toBe("toolbar-container");
      expect(steps[2].selector).toBe("#edit-track-btn");
      expect(steps[2].highlightSelector).toBe(".toolbar-container");
      expect(steps[2].title).toBe("translated_TOOLBAR_HELP_TITLE");
      expect(steps[2].position).toBe("bottom");

      // Step 3: LHS General track settings
      expect(steps[3].targetId).toBe("track-general-settings");
      expect(steps[3].selector).toBe("#track-general-settings");
      expect(steps[3].title).toBe("translated_TE_HELP_LHS_TITLE");
      expect(steps[3].content).toBe("translated_TE_HELP_LHS_CONTENT");
      expect(steps[3].position).toBe("right");

      // Step 4: Lane expander
      expect(steps[4].targetId).toBe("lane-editor-section");
      expect(steps[4].selector).toBe("#lane-editor-section");
      expect(steps[4].title).toBe("translated_TE_HELP_LANES_TITLE");
      expect(steps[4].content).toBe("translated_TE_HELP_LANES_CONTENT");
      expect(steps[4].position).toBe("right");
      expect(sections.lanes).toBeFalse();
      steps[4].onEnter?.();
      expect(sections.lanes).toBeTrue();

      // Step 5: Interface list on LHS
      expect(steps[5].targetId).toBe("interface-list-section");
      expect(steps[5].selector).toBe("#interface-list-section");
      expect(steps[5].title).toBe("translated_TE_HELP_INTERFACE_LIST_TITLE");
      expect(steps[5].content).toBe(
        "translated_TE_HELP_INTERFACE_LIST_CONTENT",
      );
      expect(steps[5].position).toBe("right");
      expect(sections.interfaces).toBeFalse();
      steps[5].onEnter?.();
      expect(sections.interfaces).toBeTrue();
    });
  });

  describe("getInterfaceHelpSteps", () => {
    it("should return empty array if no interface configs", () => {
      const steps = TrackEditorHelpHelper.getInterfaceHelpSteps(
        mockTranslationService,
        {},
        {},
      );
      expect(steps).toEqual([]);
    });

    it("should include one step per configured interface type and handle onEnter expansion", () => {
      const mockArduinoEditor = {
        sectionsExpanded: {
          arduino: true,
          main: true,
          digital: true,
          analog: true,
          voltage: true,
          leds: true,
        },
        ledStringExpanded: [true],
        cdr: { detectChanges: jasmine.createSpy("detectChanges") },
      };
      const mockTrackmateEditor = {
        sectionsExpanded: {
          trakmate: true,
          main: true,
          rw: true,
        },
        cdr: { detectChanges: jasmine.createSpy("detectChanges") },
      };
      const mockPhidgetEditor = {
        sectionsExpanded: {
          phidget: true,
          main: true,
          pins: true,
          digitalIn: true,
          digitalOut: true,
        },
        cdr: { detectChanges: jasmine.createSpy("detectChanges") },
      };
      const mockBartEditor = {
        sectionsExpanded: {
          bart: true,
          main: true,
          rw: true,
        },
        cdr: { detectChanges: jasmine.createSpy("detectChanges") },
      };

      const editors = {
        arduinoEditors: {
          first: mockArduinoEditor,
        } as unknown as QueryList<any>,
        trakmateEditors: {
          first: mockTrackmateEditor,
        } as unknown as QueryList<any>,
        phidgetEditors: {
          first: mockPhidgetEditor,
        } as unknown as QueryList<any>,
        bartEditors: { first: mockBartEditor } as unknown as QueryList<any>,
      };

      const configs = {
        arduinoConfigs: [{ name: "A1" } as any, { name: "A2" } as any],
        trackmateConfigs: [{ name: "TM1" } as any],
        phidgetConfigs: [{ name: "P1" } as any, { name: "P2" } as any],
        bartConfigs: [{ name: "B1" } as any],
      };

      const steps = TrackEditorHelpHelper.getInterfaceHelpSteps(
        mockTranslationService,
        editors,
        configs,
      );

      // Exactly 4 steps (deduplicated across duplicate Arduinos and Phidgets)
      expect(steps.length).toBe(4);

      // Arduino step
      expect(steps[0].targetId).toBe("interface-arduino-0");
      expect(steps[0].selector).toBe("#interface-arduino-0");
      expect(steps[0].title).toBe("translated_TE_HELP_ARDUINO_TITLE");
      expect(steps[0].content).toBe("translated_TE_HELP_ARDUINO_CONTENT");
      expect(steps[0].position).toBe("left");
      steps[0].onEnter?.();
      expect(mockArduinoEditor.sectionsExpanded.arduino).toBeTrue();
      expect(mockArduinoEditor.sectionsExpanded.main).toBeFalse();
      expect(mockArduinoEditor.sectionsExpanded.digital).toBeFalse();
      expect(mockArduinoEditor.sectionsExpanded.analog).toBeFalse();
      expect(mockArduinoEditor.sectionsExpanded.voltage).toBeFalse();
      expect(mockArduinoEditor.sectionsExpanded.leds).toBeFalse();
      expect(mockArduinoEditor.ledStringExpanded).toEqual([]);
      expect(mockArduinoEditor.cdr.detectChanges).toHaveBeenCalled();

      // Trackmate step
      expect(steps[1].targetId).toBe("interface-trackmate-0");
      expect(steps[1].selector).toBe("#interface-trackmate-0");
      expect(steps[1].title).toBe("translated_TE_HELP_TRAKMATE_TITLE");
      expect(steps[1].content).toBe("translated_TE_HELP_TRAKMATE_CONTENT");
      expect(steps[1].position).toBe("left");
      steps[1].onEnter?.();
      expect(mockTrackmateEditor.sectionsExpanded.trakmate).toBeTrue();
      expect(mockTrackmateEditor.sectionsExpanded.main).toBeFalse();
      expect(mockTrackmateEditor.sectionsExpanded.rw).toBeFalse();
      expect(mockTrackmateEditor.cdr.detectChanges).toHaveBeenCalled();

      // Phidget step
      expect(steps[2].targetId).toBe("interface-phidget-0");
      expect(steps[2].selector).toBe("#interface-phidget-0");
      expect(steps[2].title).toBe("translated_TE_HELP_PHIDGET_TITLE");
      expect(steps[2].content).toBe("translated_TE_HELP_PHIDGET_CONTENT");
      expect(steps[2].position).toBe("left");
      steps[2].onEnter?.();
      expect(mockPhidgetEditor.sectionsExpanded.phidget).toBeTrue();
      expect(mockPhidgetEditor.sectionsExpanded.main).toBeFalse();
      expect(mockPhidgetEditor.sectionsExpanded.pins).toBeFalse();
      expect(mockPhidgetEditor.sectionsExpanded.digitalIn).toBeFalse();
      expect(mockPhidgetEditor.sectionsExpanded.digitalOut).toBeFalse();
      expect(mockPhidgetEditor.cdr.detectChanges).toHaveBeenCalled();

      // BART step
      expect(steps[3].targetId).toBe("interface-bart-0");
      expect(steps[3].selector).toBe("#interface-bart-0");
      expect(steps[3].title).toBe("translated_TE_HELP_BART_TITLE");
      expect(steps[3].content).toBe("translated_TE_HELP_BART_CONTENT");
      expect(steps[3].position).toBe("left");
      steps[3].onEnter?.();
      expect(mockBartEditor.sectionsExpanded.bart).toBeTrue();
      expect(mockBartEditor.sectionsExpanded.main).toBeFalse();
      expect(mockBartEditor.sectionsExpanded.rw).toBeFalse();
      expect(mockBartEditor.cdr.detectChanges).toHaveBeenCalled();
    });
  });

  describe("getHelpSteps", () => {
    it("should combine base and interface steps", () => {
      const allSteps = TrackEditorHelpHelper.getHelpSteps(
        mockTranslationService,
        {},
        {
          arduinoConfigs: [{ name: "A1" } as any],
        },
      );
      expect(allSteps.length).toBe(7); // 6 base + 1 arduino
    });
  });

  describe("ensureSectionsExpandedForHelp", () => {
    it("should expand lanes and interfaces sections if collapsed", () => {
      const sections = { general: true, interfaces: false, lanes: false };
      const changed = TrackEditorHelpHelper.ensureSectionsExpandedForHelp(
        sections,
        true,
      );

      expect(changed).toBeTrue();
      expect(sections.lanes).toBeTrue();
      expect(sections.interfaces).toBeTrue();
    });
  });

  describe("help links validation", () => {
    it("should verify that all help links in en.json for track editor steps are well-formed", () => {
      const realTranslationService = {
        translate: (key: string) =>
          (enJson as Record<string, string>)[key] || key,
      } as any;

      const steps = TrackEditorHelpHelper.getHelpSteps(
        realTranslationService,
        {},
        {
          arduinoConfigs: [{ name: "A1" } as any],
          trackmateConfigs: [{ name: "TM1" } as any],
          phidgetConfigs: [{ name: "P1" } as any],
          bartConfigs: [{ name: "B1" } as any],
        },
      );
      expect(steps.length).toBe(10); // 6 base + 4 interfaces

      for (const step of steps) {
        expect(step.title).not.toBe("");
        expect(step.content).not.toBe("");

        if (step.content.includes("help-link")) {
          GuideStepTestHelper.verifyHelpLinksInContent(
            step.content,
            `Step: ${step.title}`,
          );
        }
      }

      // Step-specific link destination checks
      expect(steps[0].content).toContain("help-article-track-editor");
      expect(steps[2].content).toContain("help-article-toolbar");
      expect(steps[3].content).toContain("help-article-track-editor");
      expect(steps[3].content).toContain("help-section-track-settings");
      expect(steps[4].content).toContain("help-article-track-editor");
      expect(steps[4].content).toContain("help-section-lane-configuration");
      expect(steps[5].content).toContain("help-article-track-editor");
      expect(steps[5].content).toContain("help-section-hardware-interfaces");
      expect(steps[6].content).toContain("help-article-track-editor");
      expect(steps[6].content).toContain("help-section-arduino-interface");
      expect(steps[7].content).toContain("help-article-track-editor");
      expect(steps[7].content).toContain("help-section-trackmate-interface");
      expect(steps[8].content).toContain("help-article-track-editor");
      expect(steps[8].content).toContain("help-section-phidget-interface");
      expect(steps[9].content).toContain("help-article-track-editor");
      expect(steps[9].content).toContain("help-section-bart-interface");
    });
  });
});
