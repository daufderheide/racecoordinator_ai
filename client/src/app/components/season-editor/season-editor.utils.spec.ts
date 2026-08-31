import { Season } from "@app/models/season";
import { TranslationService } from "@app/services/translation.service";

import {
  areSeasonsEqual,
  cloneSeason,
  getSeasonEditorHelpSteps,
} from "./season-editor.utils";

describe("season-editor.utils", () => {
  const mockTranslationService = {
    translate: (key: string) => key,
  } as unknown as TranslationService;

  it("should clone season and compare seasons for equality", () => {
    const season: Season = {
      entity_id: "s1",
      name: "Season 1",
      drops: 2,
      races: [],
    };
    const cloned = cloneSeason(season);
    expect(cloned).toEqual(season);
    expect(areSeasonsEqual(season, cloned)).toBeTrue();

    const diff: Season = { ...season, name: "Season 2" };
    expect(areSeasonsEqual(season, diff)).toBeFalse();
  });

  it("should generate help steps with demo badge when hasDemoRaces is true", () => {
    const steps = getSeasonEditorHelpSteps(true, mockTranslationService);
    expect(steps.length).toBe(8);
    const demoStep = steps.find(
      (s) => s.selector === "#season-editor-demo-badge",
    );
    expect(demoStep).toBeDefined();
  });

  it("should generate help steps with meta selector when hasDemoRaces is false", () => {
    const steps = getSeasonEditorHelpSteps(false, mockTranslationService);
    expect(steps.length).toBe(8);
    const demoStep = steps.find((s) => s.selector === "#season-editor-meta");
    expect(demoStep).toBeDefined();
  });
});
