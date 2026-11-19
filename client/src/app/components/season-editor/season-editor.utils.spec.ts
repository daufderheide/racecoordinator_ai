import { Season } from "@app/models/season";

import {
  areSeasonsEqual,
  calculateSeasonStandings,
  cloneSeason,
  compareDriverNames,
} from "./season-editor.utils";

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

  // https://github.com/daufderheide/racecoordinator_ai/issues/972
  it("should order a full tie by name, whatever the driver ids", () => {
    for (const [idA, idB] of [
      ["1", "2"],
      ["2", "1"],
    ]) {
      const season: Season = {
        name: "Tie",
        drops: 0,
        races: [
          {
            race_id: "1",
            race_name: "Night",
            timestamp: 1000,
            driver_results: [
              { driver_id: idA, driver_name: "Bank Farter", total_points: 10 },
              { driver_id: idB, driver_name: "Bad Cheese", total_points: 10 },
            ] as any,
          },
        ],
      };
      const standings = calculateSeasonStandings(season);
      expect(standings.map((s) => s.driver_name)).toEqual([
        "Bad Cheese",
        "Bank Farter",
      ]);
    }
  });

  it("should compare names without case", () => {
    expect(compareDriverNames("abby", "Bob")).toBeLessThan(0);
    expect(compareDriverNames("Bob", "abby")).toBeGreaterThan(0);
    expect(compareDriverNames(undefined, undefined)).toBe(0);
  });
});
