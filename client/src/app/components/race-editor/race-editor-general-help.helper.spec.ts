import { RaceEditorGeneralHelpHelper } from "./race-editor-general-help.helper";

describe("RaceEditorGeneralHelpHelper", () => {
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

  it("should return general basic help steps and toggle general section onEnter", () => {
    const steps = RaceEditorGeneralHelpHelper.getGeneralBasicHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].title).toBe("RE_HELP_WELCOME_TITLE");

    const nameStep = steps.find((s) => s.selector === "#race-name-input");
    expect(nameStep).toBeDefined();
    nameStep?.onEnter?.();
    expect(sectionsExpanded.general).toBeTrue();
  });

  it("should return general advanced help steps and toggle general section onEnter", () => {
    const steps = RaceEditorGeneralHelpHelper.getGeneralAdvancedHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(steps.length).toBeGreaterThan(0);

    const minLapTimeStep = steps.find(
      (s) => s.selector === "#min-lap-time-input",
    );
    expect(minLapTimeStep).toBeDefined();
    minLapTimeStep?.onEnter?.();
    expect(sectionsExpanded.general).toBeTrue();
  });

  it("should combine general basic and advanced steps in getGeneralHelpSteps", () => {
    const basic = RaceEditorGeneralHelpHelper.getGeneralBasicHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    const adv = RaceEditorGeneralHelpHelper.getGeneralAdvancedHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    const combined = RaceEditorGeneralHelpHelper.getGeneralHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(combined.length).toBe(basic.length + adv.length);
  });

  it("should return start method timing and penalty steps and toggle start section onEnter", () => {
    const timing = RaceEditorGeneralHelpHelper.getStartMethodTimingHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(timing.length).toBeGreaterThan(0);
    timing[0].onEnter?.();
    expect(sectionsExpanded.start_method).toBeTrue();

    sectionsExpanded.start_method = false;
    const penalty = RaceEditorGeneralHelpHelper.getStartMethodPenaltyHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(penalty.length).toBeGreaterThan(0);
    penalty[0].onEnter?.();
    expect(sectionsExpanded.start_method).toBeTrue();

    const allStart = RaceEditorGeneralHelpHelper.getStartMethodHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(allStart.length).toBe(timing.length + penalty.length);
  });

  it("should return heat and overall scoring steps and toggle scoring section onEnter", () => {
    const heat = RaceEditorGeneralHelpHelper.getHeatScoringHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(heat.length).toBeGreaterThan(0);
    heat[0].onEnter?.();
    expect(sectionsExpanded.scoring).toBeTrue();

    sectionsExpanded.scoring = false;
    const overall = RaceEditorGeneralHelpHelper.getOverallScoringHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(overall.length).toBeGreaterThan(0);
    overall[0].onEnter?.();
    expect(sectionsExpanded.scoring).toBeTrue();

    const allScoring = RaceEditorGeneralHelpHelper.getScoringHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(allScoring.length).toBe(heat.length + overall.length);
  });

  it("should return season points steps (primary, secondary, bonus) and toggle season section onEnter", () => {
    const primary = RaceEditorGeneralHelpHelper.getSeasonPointsPrimaryHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(primary.length).toBeGreaterThan(0);
    primary[0].onEnter?.();
    expect(sectionsExpanded.season_points).toBeTrue();

    sectionsExpanded.season_points = false;
    const secondary =
      RaceEditorGeneralHelpHelper.getSeasonPointsSecondaryHelpSteps(
        mockTranslationService,
        sectionsExpanded,
      );
    expect(secondary.length).toBeGreaterThan(0);
    secondary[0].onEnter?.();
    expect(sectionsExpanded.season_points).toBeTrue();

    sectionsExpanded.season_points = false;
    const bonus = RaceEditorGeneralHelpHelper.getSeasonPointsBonusHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(bonus.length).toBeGreaterThan(0);
    bonus[0].onEnter?.();
    expect(sectionsExpanded.season_points).toBeTrue();

    const allSeason = RaceEditorGeneralHelpHelper.getSeasonPointsHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(allSeason.length).toBe(
      primary.length + secondary.length + bonus.length,
    );
  });

  it("should return heats steps and toggle heats section onEnter", () => {
    const heats = RaceEditorGeneralHelpHelper.getHeatsHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(heats.length).toBeGreaterThan(0);
    heats[0].onEnter?.();
    expect(sectionsExpanded.heats).toBeTrue();
  });

  it("should return groups steps (basic, advancing) and toggle groups section onEnter", () => {
    const basic = RaceEditorGeneralHelpHelper.getGroupsBasicHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(basic.length).toBeGreaterThan(0);
    basic[0].onEnter?.();
    expect(sectionsExpanded.groups).toBeTrue();

    sectionsExpanded.groups = false;
    const adv = RaceEditorGeneralHelpHelper.getGroupsAdvancingHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(adv.length).toBeGreaterThan(0);
    adv[0].onEnter?.();
    expect(sectionsExpanded.groups).toBeTrue();

    const allGroups = RaceEditorGeneralHelpHelper.getGroupsHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(allGroups.length).toBe(basic.length + adv.length);
  });

  it("should return team options steps and toggle team section onEnter", () => {
    const team = RaceEditorGeneralHelpHelper.getTeamOptionsHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(team.length).toBeGreaterThan(0);
    team[0].onEnter?.();
    expect(sectionsExpanded.team).toBeTrue();
  });
});
