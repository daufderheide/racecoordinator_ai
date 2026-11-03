import { GuideStepTestHelper } from "@app/testing/guide-step-test.helper";

import enJson from "../../../assets/i18n/en.json";
import {
  AssetManagerHelpHelper,
  getAssetManagerHelpSteps,
} from "./asset-manager-help";

describe("AssetManagerHelpHelper", () => {
  let mockTranslationService: any;

  beforeEach(() => {
    mockTranslationService = {
      translate: (key: string) => `translated_${key}`,
    };
  });

  it("should return all 8 expected help steps in order with targets and selectors", () => {
    const steps = AssetManagerHelpHelper.getHelpSteps(mockTranslationService);
    expect(steps.length).toBe(8);

    // Step 0: Overview (General info)
    expect(steps[0].title).toBe("translated_AM_HELP_WELCOME_TITLE");
    expect(steps[0].content).toBe("translated_AM_HELP_WELCOME_CONTENT");
    expect(steps[0].position).toBe("center");
    expect(steps[0].targetId).toBeUndefined();

    // Step 1: Toolbar
    expect(steps[1].targetId).toBe("toolbar-container");
    expect(steps[1].selector).toBe(".toolbar-container");
    expect(steps[1].highlightTargetId).toBe("toolbar-container");
    expect(steps[1].highlightSelector).toBe(".toolbar-container");
    expect(steps[1].title).toBe("translated_TOOLBAR_HELP_TITLE");
    expect(steps[1].position).toBe("bottom");

    // Step 2: Database Statistics
    expect(steps[2].targetId).toBe("asset-stats-panel");
    expect(steps[2].selector).toBe("#asset-stats-panel");
    expect(steps[2].title).toBe("translated_AM_HELP_STATS_TITLE");
    expect(steps[2].position).toBe("right");

    // Step 3: Add Assets (All 4 buttons on LHS)
    expect(steps[3].targetId).toBe("asset-creation-actions");
    expect(steps[3].selector).toBe("#asset-creation-actions");
    expect(steps[3].title).toBe("translated_AM_HELP_ADD_ASSETS_TITLE");
    expect(steps[3].position).toBe("right");

    // Step 4: Asset Library
    expect(steps[4].targetId).toBe("asset-library-panel");
    expect(steps[4].selector).toBe("#asset-library-panel");
    expect(steps[4].title).toBe("translated_AM_HELP_LIBRARY_TITLE");
    expect(steps[4].position).toBe("left");

    // Step 5: Filter Tabs
    expect(steps[5].targetId).toBe("asset-filter-tabs");
    expect(steps[5].selector).toBe("#asset-filter-tabs");
    expect(steps[5].title).toBe("translated_AM_HELP_FILTER_TABS_TITLE");
    expect(steps[5].position).toBe("bottom");

    // Step 6: View Layout Options
    expect(steps[6].targetId).toBe("asset-layout-switcher");
    expect(steps[6].selector).toBe("#asset-layout-switcher");
    expect(steps[6].title).toBe("translated_AM_HELP_LAYOUT_TITLE");
    expect(steps[6].position).toBe("bottom");

    // Step 7: Filter by Name
    expect(steps[7].targetId).toBe("asset-filter-input");
    expect(steps[7].selector).toBe("#asset-filter-input");
    expect(steps[7].title).toBe("translated_AM_HELP_FILTER_NAME_TITLE");
    expect(steps[7].position).toBe("bottom");
  });

  it("should support getAssetManagerHelpSteps helper function", () => {
    const steps = getAssetManagerHelpSteps(mockTranslationService);
    expect(steps.length).toBe(8);
    expect(steps[0].title).toBe("translated_AM_HELP_WELCOME_TITLE");
    expect(steps[1].targetId).toBe("toolbar-container");
    expect(steps[7].targetId).toBe("asset-filter-input");
  });

  it("should verify that all help links in en.json for asset manager steps are well-formed", () => {
    const realTranslationService = {
      translate: (key: string) =>
        (enJson as Record<string, string>)[key] || key,
    } as any;

    const steps = AssetManagerHelpHelper.getHelpSteps(realTranslationService);
    expect(steps.length).toBe(8);

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
    expect(steps[0].content).toContain("help-article-asset-manager");
    expect(steps[1].content).toContain("help-article-toolbar");
    expect(steps[3].content).toContain("help-article-asset-manager");
    expect(steps[3].content).toContain("help-section-adding-assets");
    expect(steps[4].content).toContain("help-article-asset-manager");
    expect(steps[4].content).toContain("help-section-asset-library");
    expect(steps[5].content).toContain("help-article-asset-manager");
    expect(steps[5].content).toContain("help-section-filter-tabs");
  });
});
