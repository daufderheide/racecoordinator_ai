import { GuideStepTestHelper } from "@app/testing/guide-step-test.helper";

import enJson from "../../../assets/i18n/en.json";
import {
  buildLayoutEditorHelpSteps,
  LayoutEditorHelpHelper,
} from "./layout-editor-help.helper";

describe("LayoutEditorHelpHelper", () => {
  let mockTranslationService: any;

  beforeEach(() => {
    mockTranslationService = {
      translate: jasmine
        .createSpy("translate")
        .and.callFake((key: string) => `translated_${key}`),
    };
  });

  describe("getHelpSteps", () => {
    it("should return the standard 6 help steps in expected order with correct properties", () => {
      const steps = LayoutEditorHelpHelper.getHelpSteps(mockTranslationService);
      expect(steps.length).toBe(6);

      // Step 0: Overview (General info)
      expect(steps[0].title).toBe("translated_LE_HELP_WELCOME_TITLE");
      expect(steps[0].content).toBe("translated_LE_HELP_WELCOME_CONTENT");
      expect(steps[0].position).toBe("center");
      expect(steps[0].targetId).toBeUndefined();
      expect(steps[0].selector).toBeUndefined();

      // Step 1: Select layout nav
      expect(steps[1].targetId).toBe("editor-object-nav");
      expect(steps[1].selector).toBe("#editor-object-nav");
      expect(steps[1].title).toBe("translated_LE_HELP_SELECTOR_TITLE");
      expect(steps[1].content).toBe("translated_LE_HELP_SELECTOR_CONTENT");
      expect(steps[1].position).toBe("bottom");

      // Step 2: Toolbar (pointing at edit button, highlighting toolbar container)
      expect(steps[2].targetId).toBe("edit-track-btn");
      expect(steps[2].highlightTargetId).toBe("toolbar-container");
      expect(steps[2].selector).toBe("#edit-track-btn");
      expect(steps[2].highlightSelector).toBe(".toolbar-container");
      expect(steps[2].title).toBe("translated_TOOLBAR_HELP_TITLE");
      expect(steps[2].content).toBe("translated_TOOLBAR_HELP_CONTENT");
      expect(steps[2].position).toBe("bottom");

      // Step 3: Layout controls toolbar
      expect(steps[3].targetId).toBe("layout-controls-toolbar");
      expect(steps[3].selector).toBe("#layout-controls-toolbar");
      expect(steps[3].title).toBe("translated_LE_HELP_CONTROLS_TITLE");
      expect(steps[3].content).toBe("translated_LE_HELP_CONTROLS_CONTENT");
      expect(steps[3].position).toBe("bottom");

      // Step 4: Widget panels toggle buttons
      expect(steps[4].targetId).toBe("layout-panel-toggles");
      expect(steps[4].selector).toBe("#layout-panel-toggles");
      expect(steps[4].title).toBe("translated_LE_HELP_PANELS_TITLE");
      expect(steps[4].content).toBe("translated_LE_HELP_PANELS_CONTENT");
      expect(steps[4].position).toBe("bottom");

      // Step 5: Canvas
      expect(steps[5].targetId).toBe("help-raceday-canvas");
      expect(steps[5].selector).toBe("#help-raceday-canvas");
      expect(steps[5].title).toBe("translated_LE_HELP_CANVAS_TITLE");
      expect(steps[5].content).toBe("translated_LE_HELP_CANVAS_CONTENT");
      expect(steps[5].position).toBe("top");
    });

    it("should delegate to LayoutEditorHelpHelper via buildLayoutEditorHelpSteps", () => {
      const steps = buildLayoutEditorHelpSteps(mockTranslationService);
      expect(steps.length).toBe(6);
      expect(steps[0].title).toBe("translated_LE_HELP_WELCOME_TITLE");
      expect(steps[3].targetId).toBe("layout-controls-toolbar");
      expect(steps[4].targetId).toBe("layout-panel-toggles");
      expect(steps[5].targetId).toBe("help-raceday-canvas");
    });
  });

  describe("help links in content", () => {
    it("should verify that all help links in en.json for layout editor steps are well-formed", () => {
      const realTranslationService = {
        translate: (key: string) =>
          (enJson as Record<string, string>)[key] || key,
      } as any;

      const steps = LayoutEditorHelpHelper.getHelpSteps(realTranslationService);
      expect(steps.length).toBe(6);

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

      // Verify specific help destination anchors
      expect(steps[0].content).toContain("help-article-layout-editor");
      expect(steps[2].content).toContain("help-article-toolbar");
      expect(steps[3].content).toContain("help-section-layout-controls");
      expect(steps[4].content).toContain("help-section-widget-panels");
      expect(steps[5].content).toContain("help-section-canvas-and-widgets");
    });
  });
});
