import { GuideStepTestHelper } from "@app/testing/guide-step-test.helper";

import enJson from "../../../assets/i18n/en.json";
import { RaceEditorHelpHelper } from "./race-editor-help.helper";

describe("RaceEditorHelpHelper", () => {
  let mockTranslationService: any;
  let sectionsExpanded: any;

  beforeEach(() => {
    mockTranslationService = {
      translate: (key: string) => `translated_${key}`,
    };
    sectionsExpanded = {
      general: false,
      heats: false,
      scoring: false,
      points_scoring: false,
      groups: false,
      start_method: false,
      team: false,
      fuel_analog: false,
      fuel_digital: false,
      season_points: false,
    };
  });

  it("should generate all 15 help steps in the expected order with targets, positions, and onEnter callbacks", () => {
    const steps = RaceEditorHelpHelper.getHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(steps.length).toBe(15);

    // Step 0: Overview (General info)
    expect(steps[0].title).toBe("translated_RE_HELP_WELCOME_TITLE");
    expect(steps[0].content).toBe("translated_RE_HELP_WELCOME_CONTENT");
    expect(steps[0].position).toBe("center");
    expect(steps[0].targetId).toBeUndefined();

    // Step 1: Select race nav
    expect(steps[1].targetId).toBe("editor-object-nav");
    expect(steps[1].selector).toBe("#editor-object-nav");
    expect(steps[1].title).toBe("translated_RE_HELP_SELECTOR_TITLE");
    expect(steps[1].position).toBe("bottom");

    // Step 2: Toolbar (pointing at edit button, highlighting toolbar container)
    expect(steps[2].targetId).toBe("edit-track-btn");
    expect(steps[2].highlightTargetId).toBe("toolbar-container");
    expect(steps[2].selector).toBe("#edit-track-btn");
    expect(steps[2].highlightSelector).toBe(".toolbar-container");
    expect(steps[2].title).toBe("translated_TOOLBAR_HELP_TITLE");
    expect(steps[2].position).toBe("bottom");

    // Step 3: LHS (race config panel)
    expect(steps[3].targetId).toBe("race-config-panel");
    expect(steps[3].selector).toBe("#race-config-panel");
    expect(steps[3].title).toBe("translated_RE_HELP_LHS_TITLE");
    expect(steps[3].position).toBe("right");

    // Step 4: Navigation tabs
    expect(steps[4].targetId).toBe("race-editor-tabs");
    expect(steps[4].selector).toBe("#race-editor-tabs");
    expect(steps[4].title).toBe("translated_RE_HELP_TABS_TITLE");
    expect(steps[4].position).toBe("bottom");

    // Step 5: General section
    expect(steps[5].targetId).toBe("general-section");
    expect(steps[5].selector).toBe("#general-section");
    expect(steps[5].title).toBe("translated_RE_HELP_EXPANDER_GENERAL_TITLE");
    expect(steps[5].position).toBe("left");

    // Step 6: Heats section
    expect(steps[6].targetId).toBe("heats-section");
    expect(steps[6].selector).toBe("#heats-section");
    expect(steps[6].title).toBe("translated_RE_HELP_EXPANDER_HEATS_TITLE");
    expect(steps[6].position).toBe("left");

    // Step 7: Scoring section
    expect(steps[7].targetId).toBe("scoring-section");
    expect(steps[7].selector).toBe("#scoring-section");
    expect(steps[7].title).toBe("translated_RE_HELP_EXPANDER_SCORING_TITLE");
    expect(steps[7].position).toBe("left");

    // Step 8: Points scoring section
    expect(steps[8].targetId).toBe("points-scoring-section");
    expect(steps[8].selector).toBe("#points-scoring-section");
    expect(steps[8].title).toBe(
      "translated_RE_HELP_EXPANDER_POINTS_SCORING_TITLE",
    );
    expect(steps[8].position).toBe("left");

    // Step 9: Group section
    expect(steps[9].targetId).toBe("group-section");
    expect(steps[9].selector).toBe("#group-section");
    expect(steps[9].title).toBe("translated_RE_HELP_EXPANDER_GROUPS_TITLE");
    expect(steps[9].position).toBe("left");

    // Step 10: Start method section
    expect(steps[10].targetId).toBe("start-method-section");
    expect(steps[10].selector).toBe("#start-method-section");
    expect(steps[10].title).toBe(
      "translated_RE_HELP_EXPANDER_START_METHOD_TITLE",
    );
    expect(steps[10].position).toBe("left");

    // Step 11: Team options section
    expect(steps[11].targetId).toBe("team-options-section");
    expect(steps[11].selector).toBe("#team-options-section");
    expect(steps[11].title).toBe(
      "translated_RE_HELP_EXPANDER_TEAM_OPTIONS_TITLE",
    );
    expect(steps[11].position).toBe("left");

    // Step 12: Analog fuel section
    expect(steps[12].targetId).toBe("analog-fuel-section");
    expect(steps[12].selector).toBe("#analog-fuel-section");
    expect(steps[12].title).toBe(
      "translated_RE_HELP_EXPANDER_ANALOG_FUEL_TITLE",
    );
    expect(steps[12].position).toBe("left");

    // Step 13: Digital fuel outer section
    expect(steps[13].targetId).toBe("digital-fuel-outer-section");
    expect(steps[13].selector).toBe("#digital-fuel-outer-section");
    expect(steps[13].title).toBe(
      "translated_RE_HELP_EXPANDER_DIGITAL_FUEL_TITLE",
    );
    expect(steps[13].position).toBe("left");

    // Step 14: Season points section
    expect(steps[14].targetId).toBe("season-points-section");
    expect(steps[14].selector).toBe("#season-points-section");
    expect(steps[14].title).toBe(
      "translated_RE_HELP_EXPANDER_SEASON_POINTS_TITLE",
    );
    expect(steps[14].position).toBe("left");

    // Verify onEnter callbacks expand corresponding sections
    expect(sectionsExpanded.general).toBeFalse();
    steps[5].onEnter?.();
    expect(sectionsExpanded.general).toBeTrue();

    expect(sectionsExpanded.heats).toBeFalse();
    steps[6].onEnter?.();
    expect(sectionsExpanded.heats).toBeTrue();

    expect(sectionsExpanded.scoring).toBeFalse();
    steps[7].onEnter?.();
    expect(sectionsExpanded.scoring).toBeTrue();

    expect(sectionsExpanded.points_scoring).toBeFalse();
    steps[8].onEnter?.();
    expect(sectionsExpanded.points_scoring).toBeTrue();

    expect(sectionsExpanded.groups).toBeFalse();
    steps[9].onEnter?.();
    expect(sectionsExpanded.groups).toBeTrue();

    expect(sectionsExpanded.start_method).toBeFalse();
    steps[10].onEnter?.();
    expect(sectionsExpanded.start_method).toBeTrue();

    expect(sectionsExpanded.team).toBeFalse();
    steps[11].onEnter?.();
    expect(sectionsExpanded.team).toBeTrue();

    expect(sectionsExpanded.fuel_analog).toBeFalse();
    steps[12].onEnter?.();
    expect(sectionsExpanded.fuel_analog).toBeTrue();

    expect(sectionsExpanded.fuel_digital).toBeFalse();
    steps[13].onEnter?.();
    expect(sectionsExpanded.fuel_digital).toBeTrue();

    expect(sectionsExpanded.season_points).toBeFalse();
    steps[14].onEnter?.();
    expect(sectionsExpanded.season_points).toBeTrue();
  });

  it("should handle null or undefined sectionsExpanded gracefully in onEnter", () => {
    const steps = RaceEditorHelpHelper.getHelpSteps(
      mockTranslationService,
      undefined,
    );
    expect(() => steps[5].onEnter?.()).not.toThrow();
  });

  it("should invoke onSectionExpanded callback when provided on onEnter", () => {
    const onExpandedSpy = jasmine.createSpy("onSectionExpanded");
    const steps = RaceEditorHelpHelper.getHelpSteps(
      mockTranslationService,
      sectionsExpanded,
      onExpandedSpy,
    );
    steps[5].onEnter?.();
    expect(onExpandedSpy).toHaveBeenCalledTimes(1);
    steps[12].onEnter?.();
    expect(onExpandedSpy).toHaveBeenCalledTimes(2);
  });

  it("should verify that all help links in en.json for race editor steps are well-formed", () => {
    const realTranslationService = {
      translate: (key: string) =>
        (enJson as Record<string, string>)[key] || key,
    } as any;

    const steps = RaceEditorHelpHelper.getHelpSteps(
      realTranslationService,
      sectionsExpanded,
    );

    expect(steps.length).toBe(15);

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
    expect(steps[0].content).toContain("help-article-race-editor");
    expect(steps[2].content).toContain("help-article-toolbar");
    expect(steps[3].content).toContain("help-article-race-editor");
    expect(steps[3].content).toContain("help-section-race-setup");
    expect(steps[4].content).toContain("help-article-race-editor");
    expect(steps[4].content).toContain("help-section-navigation-tabs");
    expect(steps[5].content).toContain("help-article-race-editor");
    expect(steps[5].content).toContain("help-section-general-settings");
    expect(steps[6].content).toContain("help-article-race-editor");
    expect(steps[6].content).toContain("help-section-heat-options");
    expect(steps[7].content).toContain("help-article-race-editor");
    expect(steps[7].content).toContain("help-section-scoring-rules");
    expect(steps[8].content).toContain("help-article-race-editor");
    expect(steps[8].content).toContain("help-section-points-scoring");
    expect(steps[9].content).toContain("help-article-race-editor");
    expect(steps[9].content).toContain("help-section-groups-and-stages");
    expect(steps[10].content).toContain("help-article-race-editor");
    expect(steps[10].content).toContain("help-section-start-methods");
    expect(steps[11].content).toContain("help-article-race-editor");
    expect(steps[11].content).toContain("help-section-team-racing");
    expect(steps[12].content).toContain("help-article-race-editor");
    expect(steps[12].content).toContain("help-section-analog-fuel-simulation");
    expect(steps[13].content).toContain("help-article-race-editor");
    expect(steps[13].content).toContain("help-section-digital-fuel-simulation");
    expect(steps[14].content).toContain("help-article-race-editor");
    expect(steps[14].content).toContain("help-section-season-scoring");
  });
});
