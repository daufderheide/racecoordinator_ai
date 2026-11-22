import { RacePackageResult } from "@app/models/race-package.model";
import { Season, SeasonRaceRecord } from "@app/models/season";

import {
  areSeasonsEqual,
  buildSeasonPackageAckDetails,
  cloneSeason,
  collectAvailableFinishedRaces,
  getRaceDeduplicationKey,
  isRaceAlreadyInSeason,
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

  describe("isRaceAlreadyInSeason and getRaceDeduplicationKey", () => {
    const existing: SeasonRaceRecord[] = [
      {
        race_id: "r1",
        race_name: "Grand Prix 1",
        timestamp: 1000,
        driver_results: [],
      },
      {
        race_id: "r2",
        race_name: "Grand Prix 2",
        timestamp: 2000,
        driver_results: [],
      },
    ];

    it("should return false if existing races is empty", () => {
      expect(
        isRaceAlreadyInSeason(
          {
            race_id: "r1",
            race_name: "Grand Prix 1",
            timestamp: 1000,
            driver_results: [],
          },
          [],
        ),
      ).toBeFalse();
    });

    it("should match by timestamp when timestamps are positive", () => {
      expect(
        isRaceAlreadyInSeason(
          {
            race_id: "diff_id",
            race_name: "Diff Name",
            timestamp: 1000,
            driver_results: [],
          },
          existing,
        ),
      ).toBeTrue();
      expect(
        isRaceAlreadyInSeason(
          {
            race_id: "r99",
            race_name: "Other",
            timestamp: 9999,
            driver_results: [],
          },
          existing,
        ),
      ).toBeFalse();
    });

    it("should match by race_id when timestamps are absent", () => {
      expect(
        isRaceAlreadyInSeason(
          {
            race_id: "r1",
            race_name: "Some Name",
            timestamp: 0,
            driver_results: [],
          },
          [
            {
              race_id: "r1",
              race_name: "Old Name",
              timestamp: 0,
              driver_results: [],
            },
          ],
        ),
      ).toBeTrue();
    });

    it("should match by case-insensitive name when id and timestamp are absent", () => {
      expect(
        isRaceAlreadyInSeason(
          {
            race_id: "",
            race_name: "grand prix 1",
            timestamp: 0,
            driver_results: [],
          },
          [
            {
              race_id: "",
              race_name: "Grand Prix 1",
              timestamp: 0,
              driver_results: [],
            },
          ],
        ),
      ).toBeTrue();
    });

    it("should generate proper deduplication key", () => {
      expect(
        getRaceDeduplicationKey({
          race_id: "r1",
          race_name: "GP",
          timestamp: 5000,
          driver_results: [],
        }),
      ).toBe("ts_5000");
      expect(
        getRaceDeduplicationKey({
          race_id: "r1",
          race_name: "GP",
          timestamp: 0,
          driver_results: [],
        }),
      ).toBe("id_r1");
    });
  });

  describe("collectAvailableFinishedRaces", () => {
    it("should combine and deduplicate races from existing seasons and finished history", () => {
      const existingInSeason: SeasonRaceRecord[] = [
        {
          race_id: "r1",
          race_name: "R1",
          timestamp: 1000,
          driver_results: [],
        },
      ];
      const otherSeasons: Season[] = [
        {
          name: "S2",
          drops: 0,
          races: [
            {
              race_id: "r1",
              race_name: "R1",
              timestamp: 1000,
              driver_results: [],
            }, // duplicate
            {
              race_id: "r2",
              race_name: "R2",
              timestamp: 2000,
              is_demo: true,
              driver_results: [],
            },
          ],
        },
      ];
      const history: any[] = [
        {
          race_id: "r2",
          original_entity_id: "r2",
          model: { name: "R2" },
          timestamp: 2000,
          is_demo: false, // upgrades is_demo to false
        },
        {
          race_id: "r3",
          original_entity_id: "r3",
          model: { name: "R3" },
          timestamp: 3000,
          is_demo: false,
        },
        {
          race_id: "subrace_1",
          original_entity_id: "subrace_1",
          event_id: "event_123",
          is_event_race: true,
          timestamp: 4000,
        },
      ];

      const available = collectAvailableFinishedRaces(
        existingInSeason,
        otherSeasons,
        history,
      );

      expect(available.length).toBe(2);
      expect(available[0].race_id).toBe("r3");
      expect(available[0].timestamp).toBe(3000);
      expect(available[1].race_id).toBe("r2");
      expect(available[1].is_demo).toBeFalse();
    });
  });

  describe("buildSeasonPackageAckDetails", () => {
    const mockTranslate = (k: string) => `TRANS_${k}`;

    it("should return null if result is null or failed", () => {
      expect(
        buildSeasonPackageAckDetails(null as any, mockTranslate),
      ).toBeNull();
      expect(
        buildSeasonPackageAckDetails({ success: false } as any, mockTranslate),
      ).toBeNull();
    });

    it("should build ack details for SKIPPED action", () => {
      const res: RacePackageResult = {
        success: true,
        action: "SKIPPED",
        imported_race_id: "r-skip",
        race_name: "Skipped GP",
        driver_count: 4,
        drivers_created: 0,
        drivers_linked: 0,
      };
      const ack = buildSeasonPackageAckDetails(res, mockTranslate);
      expect(ack).not.toBeNull();
      expect(ack?.title).toBe("RPM_IMPORT_SUCCESS_TITLE");
      expect(ack?.message).toBe("RPM_IMPORT_SKIPPED_MSG");
      expect(ack?.params.raceName).toBe("Skipped GP");
    });

    it("should build ack details for created/overwritten/linked race config actions", () => {
      const res: RacePackageResult = {
        success: true,
        action: "IMPORTED",
        imported_race_id: "r-imported",
        race_name: "My GP",
        race_config_name: "My GP (Copy)",
        race_config_action: "AUTO_RENAME",
        driver_count: 5,
        drivers_created: 1,
        drivers_linked: 4,
      };
      const ack = buildSeasonPackageAckDetails(res, mockTranslate);
      expect(ack).not.toBeNull();
      expect(ack?.message).toBe("RPM_IMPORT_SUCCESS_SEASON_MSG");
      expect(ack?.params.configDetail).toBe("TRANS_RPM_CONFIG_DETAIL_RENAMED");
      expect(ack?.params.createdCount).toBe(1);
      expect(ack?.params.linkedCount).toBe(4);
    });
  });
});
