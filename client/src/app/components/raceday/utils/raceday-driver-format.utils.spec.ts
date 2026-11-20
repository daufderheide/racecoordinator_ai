import { AnchorPoint } from "@app/components/raceday/column_definition";

import { RacedayDriverFormatUtils } from "./raceday-driver-format.utils";
import { FormatContext } from "./raceday-format.utils";

describe("RacedayDriverFormatUtils", () => {
  let mockContext: FormatContext;

  beforeEach(() => {
    mockContext = {
      translate: (key: string) =>
        key === "RD_EMPTY_LANE" ? "Empty Lane" : key,
      getRace: () => ({ practice: false }) as any,
      getTrack: () => undefined,
      getDriverRanking: () => undefined,
      getFlagType: () => "flag.green",
      getFlagUrl: (flag: any) => `assets/flags/${flag}.svg`,
      getFormattedRaceTime: () => "00:00.000",
      getImageSetUrl: () => "",
      getLaneQrCodeUrl: () => "",
      getDriverViewQrCodeUrl: () => "",
      getFullUrl: (url: string | undefined) =>
        url ? `http://localhost/${url}` : "",
      formatDate: (ms: number) => new Date(ms).toISOString(),
    } as any;
  });

  describe("formatGhostPacing", () => {
    it("returns '--' for empty driver", () => {
      const hd = { isEmpty: true } as any;
      expect(RacedayDriverFormatUtils.formatGhostPacing(hd, 2)).toBe("--");
    });

    it("returns '--' if ghostLap or currentLapTime <= 0", () => {
      const hd = {
        actualDriver: { name: "Driver 1" },
        ghostLapTime: 0,
        currentLapTime: 5.0,
      } as any;
      expect(RacedayDriverFormatUtils.formatGhostPacing(hd, 2)).toBe("--");
    });

    it("formats positive delta with leading '+'", () => {
      const hd = {
        actualDriver: { name: "Driver 1" },
        ghostLapTime: 5.5,
        currentLapTime: 5.0,
      } as any;
      expect(RacedayDriverFormatUtils.formatGhostPacing(hd, 2)).toBe("+0.50s");
    });

    it("formats negative delta without '+'", () => {
      const hd = {
        actualDriver: { name: "Driver 1" },
        ghostLapTime: 4.8,
        currentLapTime: 5.0,
      } as any;
      expect(RacedayDriverFormatUtils.formatGhostPacing(hd, 2)).toBe("-0.20s");
    });

    it("formats 0 delta as 0.00s", () => {
      const hd = {
        actualDriver: { name: "Driver 1" },
        ghostLapTime: 5.0,
        currentLapTime: 5.0,
      } as any;
      expect(RacedayDriverFormatUtils.formatGhostPacing(hd, 2)).toBe("0.00s");
    });
  });

  describe("formatDriverNameOrNickname", () => {
    it("returns Empty Lane text for empty driver by default", () => {
      const hd = { isEmpty: true } as any;
      expect(
        RacedayDriverFormatUtils.formatDriverNameOrNickname(
          "driver.name",
          "driver.name",
          hd,
          mockContext,
        ),
      ).toBe("Empty Lane");
    });

    it("returns empty string if emptyRowsMode is 'blank'", () => {
      const hd = { isEmpty: true } as any;
      mockContext.laneViewWidgetSettings = { emptyRowsMode: "blank" } as any;
      expect(
        RacedayDriverFormatUtils.formatDriverNameOrNickname(
          "driver.name",
          "driver.name",
          hd,
          mockContext,
        ),
      ).toBe("");
    });

    it("returns '--' in overall context when emptyRowsMode is 'empty'", () => {
      const hd = { isEmpty: true } as any;
      mockContext.laneViewWidgetSettings = {
        emptyRowsMode: "empty",
        gridType: "overall",
      } as any;
      expect(
        RacedayDriverFormatUtils.formatDriverNameOrNickname(
          "driver.name",
          "driver.name",
          hd,
          mockContext,
        ),
      ).toBe("--");
    });

    it("returns driver nickname when requested", () => {
      const hd = {
        actualDriver: { name: "John Doe", nickname: "Johnny" },
      } as any;
      expect(
        RacedayDriverFormatUtils.formatDriverNameOrNickname(
          "driver.nickname",
          "driver.nickname",
          hd,
          mockContext,
        ),
      ).toBe("Johnny");
    });

    it("falls back to driver name if nickname is missing", () => {
      const hd = {
        actualDriver: { name: "John Doe" },
      } as any;
      expect(
        RacedayDriverFormatUtils.formatDriverNameOrNickname(
          "driver.nickname",
          "driver.nickname",
          hd,
          mockContext,
        ),
      ).toBe("John Doe");
    });

    it("returns team name if driver name is absent", () => {
      const hd = {
        team: { name: "Team Red" },
      } as any;
      expect(
        RacedayDriverFormatUtils.formatDriverNameOrNickname(
          "driver.name",
          "driver.name",
          hd,
          mockContext,
        ),
      ).toBe("Team Red");
    });
  });

  describe("formatTeamName", () => {
    it("returns empty string during practice", () => {
      const hd = { actualDriver: { name: "Driver 1" } } as any;
      mockContext.getRace = () => ({ practice: true }) as any;
      expect(
        RacedayDriverFormatUtils.formatTeamName(
          "participant.team.name",
          hd,
          undefined,
          mockContext,
        ),
      ).toBe("");
    });

    it("returns Empty Lane for empty driver if column is CenterCenter", () => {
      const hd = { isEmpty: true } as any;
      const col = {
        layout: {
          [AnchorPoint.CenterCenter]: "participant.team.name",
        },
      } as any;
      expect(
        RacedayDriverFormatUtils.formatTeamName(
          "participant.team.name",
          hd,
          col,
          mockContext,
        ),
      ).toBe("Empty Lane");
    });

    it("returns team name for active driver", () => {
      const hd = {
        actualDriver: { name: "Driver 1" },
        participant: { team: { name: "Ferrari" } },
      } as any;
      expect(
        RacedayDriverFormatUtils.formatTeamName(
          "participant.team.name",
          hd,
          undefined,
          mockContext,
        ),
      ).toBe("Ferrari");
    });
  });

  describe("formatAvatarUrl", () => {
    it("returns empty string for empty driver without custom value", () => {
      const hd = { isEmpty: true } as any;
      expect(
        RacedayDriverFormatUtils.formatAvatarUrl("", hd, mockContext),
      ).toBe("");
    });

    it("returns full URL for explicit avatar url", () => {
      const hd = { actualDriver: { name: "Driver 1" } } as any;
      expect(
        RacedayDriverFormatUtils.formatAvatarUrl(
          "custom_avatar.png",
          hd,
          mockContext,
        ),
      ).toBe("http://localhost/custom_avatar.png");
    });

    it("returns default avatar full url for active driver without explicit avatar", () => {
      const hd = { actualDriver: { name: "Active Driver" } } as any;
      expect(
        RacedayDriverFormatUtils.formatAvatarUrl("", hd, mockContext),
      ).toBe("http://localhost/assets/images/default_avatar.svg");
    });
  });

  describe("formatRanks", () => {
    it("returns '--' for empty driver", () => {
      const hd = { isEmpty: true } as any;
      expect(
        RacedayDriverFormatUtils.formatRanks("rankHeat", hd, mockContext),
      ).toBe("--");
      expect(
        RacedayDriverFormatUtils.formatRanks("rankOverall", hd, mockContext),
      ).toBe("--");
      expect(
        RacedayDriverFormatUtils.formatRanks("rankGroup", hd, mockContext),
      ).toBe("--");
    });

    it("returns heat ranking from context", () => {
      const hd = {
        objectId: "driver-123",
        actualDriver: { name: "Active" },
      } as any;
      mockContext.getDriverRanking = (id: string) =>
        id === "driver-123" ? 2 : undefined;
      expect(
        RacedayDriverFormatUtils.formatRanks("rankHeat", hd, mockContext),
      ).toBe("2");
    });

    it("returns overall ranking from context or participant", () => {
      const hd = {
        actualDriver: { name: "Active" },
        participant: { rank: 4 },
      } as any;
      expect(
        RacedayDriverFormatUtils.formatRanks("rankOverall", hd, mockContext),
      ).toBe("4");
    });

    it("returns group ranking when provided", () => {
      const hd = {
        actualDriver: { name: "Active" },
      } as any;
      mockContext.getDriverGroupRanking = () => 1;
      expect(
        RacedayDriverFormatUtils.formatRanks("rankGroup", hd, mockContext),
      ).toBe("1");
    });
  });

  describe("formatPredictions", () => {
    it("formats winProbability", () => {
      const hd = {
        actualDriver: { name: "Active" },
        winProbability: 0.756,
      } as any;
      expect(
        RacedayDriverFormatUtils.formatPredictions("winProbability", hd),
      ).toBe("76%");
    });

    it("formats projectedRank", () => {
      const hd = {
        actualDriver: { name: "Active" },
        projectedRank: 3,
      } as any;
      expect(
        RacedayDriverFormatUtils.formatPredictions("projectedRank", hd),
      ).toBe("#3");
    });

    it("formats projectedLaps", () => {
      const hd = {
        actualDriver: { name: "Active" },
        projectedLaps: 45,
      } as any;
      expect(
        RacedayDriverFormatUtils.formatPredictions("projectedLaps", hd),
      ).toBe("45");
    });

    it("returns '--' for empty driver predictions", () => {
      const hd = { isEmpty: true } as any;
      expect(
        RacedayDriverFormatUtils.formatPredictions("winProbability", hd),
      ).toBe("--");
      expect(
        RacedayDriverFormatUtils.formatPredictions("projectedRank", hd),
      ).toBe("--");
      expect(
        RacedayDriverFormatUtils.formatPredictions("projectedLaps", hd),
      ).toBe("--");
    });
  });

  describe("formatDriverOrTeamValue", () => {
    it("delegates to sub-methods and returns undefined for unknown keys", () => {
      const hd = {
        actualDriver: { name: "Active Driver" },
      } as any;

      expect(
        RacedayDriverFormatUtils.formatDriverOrTeamValue(
          "driver.name",
          "driver.name",
          undefined,
          hd,
          undefined,
          mockContext,
          2,
        ),
      ).toBe("Active Driver");

      expect(
        RacedayDriverFormatUtils.formatDriverOrTeamValue(
          "unknownProperty",
          "unknownProperty",
          undefined,
          hd,
          undefined,
          mockContext,
          2,
        ),
      ).toBeUndefined();
    });
  });
});
