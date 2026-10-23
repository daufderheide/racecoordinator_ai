import { RaceEditorHelpHelper } from "./race-editor-help.helper";

describe("RaceEditorHelpHelper", () => {
  let mockTranslationService: any;
  let sectionsExpanded: any;

  beforeEach(() => {
    mockTranslationService = {
      translate: jasmine
        .createSpy("translate")
        .and.callFake((key: string) => key),
    };
    sectionsExpanded = {
      general: false,
      heats: false,
      scoring: false,
      groups: false,
      start_method: false,
      team: false,
      fuel_analog: false,
      fuel_digital: false,
      season_points: false,
    };
  });

  it("should aggregate all help steps in the expected order", () => {
    const steps = RaceEditorHelpHelper.getHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(steps.length).toBeGreaterThan(50);

    // Verify first step is welcome
    expect(steps[0].title).toBe("RE_HELP_WELCOME_TITLE");

    // Verify presence of selectors from different sections
    expect(steps.some((s) => s.selector === "#race-name-input")).toBeTrue();
    expect(steps.some((s) => s.selector === "#heat-list-section")).toBeTrue();
    expect(steps.some((s) => s.selector === "#heat-ranking-select")).toBeTrue();
    expect(
      steps.some((s) => s.selector === "#groups-enabled-input"),
    ).toBeTrue();
    expect(steps.some((s) => s.selector === "#start-time-input")).toBeTrue();
    expect(
      steps.some((s) => s.selector === "#team-pit-stop-change-driver-input"),
    ).toBeTrue();
    expect(steps.some((s) => s.selector === "#fuel-enabled-input")).toBeTrue();
    expect(
      steps.some((s) => s.selector === "#digital-fuel-enabled-input"),
    ).toBeTrue();
    expect(
      steps.some((s) => s.selector === "#season-position-points-section"),
    ).toBeTrue();
  });
});
