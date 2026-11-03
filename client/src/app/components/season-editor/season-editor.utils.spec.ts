import { Season } from "@app/models/season";

import { areSeasonsEqual, cloneSeason } from "./season-editor.utils";

describe("season-editor.utils", () => {
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
});
