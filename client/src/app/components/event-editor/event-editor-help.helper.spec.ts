import { GuideStepTestHelper } from "@app/testing/guide-step-test.helper";

import enJson from "../../../assets/i18n/en.json";
import { EventEditorHelpHelper } from "./event-editor-help.helper";

describe("EventEditorHelpHelper", () => {
  let mockTranslationService: any;

  beforeEach(() => {
    mockTranslationService = {
      translate: (key: string) => `translated_${key}`,
    };
  });

  it("should generate all 5 help steps in the expected order with targets and positions", () => {
    const steps = EventEditorHelpHelper.getHelpSteps(mockTranslationService);
    expect(steps.length).toBe(5);

    // Step 0: Overview (General info)
    expect(steps[0].title).toBe("translated_EE_HELP_WELCOME_TITLE");
    expect(steps[0].content).toBe("translated_EE_HELP_WELCOME_CONTENT");
    expect(steps[0].position).toBe("center");
    expect(steps[0].targetId).toBeUndefined();
    expect(steps[0].selector).toBeUndefined();

    // Step 1: Select event nav
    expect(steps[1].targetId).toBe("editor-object-nav");
    expect(steps[1].selector).toBe("#editor-object-nav");
    expect(steps[1].title).toBe("translated_EE_HELP_SELECTOR_TITLE");
    expect(steps[1].content).toBe("translated_EE_HELP_SELECTOR_CONTENT");
    expect(steps[1].position).toBe("bottom");

    // Step 2: Toolbar (pointing at edit button, highlighting toolbar container)
    expect(steps[2].targetId).toBe("edit-track-btn");
    expect(steps[2].highlightTargetId).toBe("toolbar-container");
    expect(steps[2].selector).toBe("#edit-track-btn");
    expect(steps[2].highlightSelector).toBe(".toolbar-container");
    expect(steps[2].title).toBe("translated_TOOLBAR_HELP_TITLE");
    expect(steps[2].position).toBe("bottom");

    // Step 3: LHS (event config panel)
    expect(steps[3].targetId).toBe("event-config-panel");
    expect(steps[3].selector).toBe("#event-config-panel");
    expect(steps[3].title).toBe("translated_EE_HELP_LHS_TITLE");
    expect(steps[3].content).toBe("translated_EE_HELP_LHS_CONTENT");
    expect(steps[3].position).toBe("right");

    // Step 4: Race sequence list
    expect(steps[4].targetId).toBe("event-race-list");
    expect(steps[4].selector).toBe("#event-race-list");
    expect(steps[4].title).toBe("translated_EE_HELP_RACE_LIST_TITLE");
    expect(steps[4].content).toBe("translated_EE_HELP_RACE_LIST_CONTENT");
    expect(steps[4].position).toBe("left");
  });

  it("should verify that all help links in en.json for event editor steps are well-formed", () => {
    const realTranslationService = {
      translate: (key: string) =>
        (enJson as Record<string, string>)[key] || key,
    } as any;

    const steps = EventEditorHelpHelper.getHelpSteps(realTranslationService);
    expect(steps.length).toBe(5);

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
    expect(steps[0].content).toContain("help-article-event-editor");
    expect(steps[2].content).toContain("help-article-toolbar");
    expect(steps[3].content).toContain("help-article-event-editor");
    expect(steps[3].content).toContain("help-section-event-configuration");
    expect(steps[4].content).toContain("help-article-event-editor");
    expect(steps[4].content).toContain("help-section-race-sequence");
  });
});
