import { GuideStepTestHelper } from "@app/testing/guide-step-test.helper";

import enJson from "../../../assets/i18n/en.json";
import {
  DatabaseManagerHelpHelper,
  getDatabaseManagerHelpSteps,
} from "./database-manager-help";

describe("DatabaseManagerHelpHelper", () => {
  let mockTranslationService: any;

  beforeEach(() => {
    mockTranslationService = {
      translate: (key: string) => `translated_${key}`,
    };
  });

  it("should return all 4 expected help steps in order with targets and selectors", () => {
    const ensureDatabaseSelectedSpy = jasmine.createSpy(
      "ensureDatabaseSelected",
    );
    const steps = DatabaseManagerHelpHelper.getHelpSteps(
      mockTranslationService,
      ensureDatabaseSelectedSpy,
    );
    expect(steps.length).toBe(4);

    // Step 0: Database List
    expect(steps[0].targetId).toBe("sidebar-list");
    expect(steps[0].selector).toBe("#sidebar-list");
    expect(steps[0].title).toBe("translated_DBM_HELP_SIDEBAR_TITLE");
    expect(steps[0].position).toBe("right");

    // Step 1: Database Summary
    expect(steps[1].targetId).toBe("detail-panel");
    expect(steps[1].selector).toBe("#detail-panel");
    expect(steps[1].title).toBe("translated_DBM_HELP_DETAIL_TITLE");
    expect(steps[1].position).toBe("left");
    steps[1].onEnter?.();
    expect(ensureDatabaseSelectedSpy).toHaveBeenCalledTimes(1);

    // Step 2: Active Database Status Checkmark
    expect(steps[2].targetId).toBe("database-active-status");
    expect(steps[2].selector).toBe("#database-active-status");
    expect(steps[2].title).toBe("translated_DBM_HELP_STATUS_TITLE");
    expect(steps[2].position).toBe("bottom");
    steps[2].onEnter?.();
    expect(ensureDatabaseSelectedSpy).toHaveBeenCalledTimes(2);

    // Step 3: Toolbar
    expect(steps[3].targetId).toBe("toolbar-container");
    expect(steps[3].selector).toBe(".toolbar-container");
    expect(steps[3].highlightTargetId).toBe("toolbar-container");
    expect(steps[3].highlightSelector).toBe(".toolbar-container");
    expect(steps[3].title).toBe("translated_TOOLBAR_HELP_TITLE");
    expect(steps[3].position).toBe("bottom");
  });

  it("should support getDatabaseManagerHelpSteps helper function", () => {
    const steps = getDatabaseManagerHelpSteps(mockTranslationService);
    expect(steps.length).toBe(4);
    expect(steps[0].targetId).toBe("sidebar-list");
    expect(steps[1].targetId).toBe("detail-panel");
    expect(steps[2].targetId).toBe("database-active-status");
    expect(steps[3].targetId).toBe("toolbar-container");
  });

  it("should have valid help center links in all steps containing help links", () => {
    const realTranslationService = {
      translate: (key: string) =>
        (enJson as Record<string, string>)[key] || key,
    };
    const steps = DatabaseManagerHelpHelper.getHelpSteps(
      realTranslationService as any,
    );

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.content.includes("help-link")) {
        GuideStepTestHelper.verifyHelpLinksInContent(
          step.content,
          `Database Manager Step ${i + 1} (${step.title})`,
        );
      }
    }

    expect(steps[0].content).toContain("help-article-database-manager");
    expect(steps[1].content).toContain("help-article-database-manager");
    expect(steps[2].content).toContain("help-article-database-manager");
    expect(steps[3].content).toContain("help-article-toolbar");
  });
});
