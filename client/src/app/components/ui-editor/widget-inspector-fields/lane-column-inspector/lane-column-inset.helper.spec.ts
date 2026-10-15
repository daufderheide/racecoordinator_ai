import {
  INSET_ANCHOR_POSITIONS,
  LaneColumnInsetHelper,
} from "./lane-column-inset.helper";

describe("LaneColumnInsetHelper", () => {
  describe("INSET_ANCHOR_POSITIONS", () => {
    it("should define exactly 8 positions with short labels", () => {
      expect(INSET_ANCHOR_POSITIONS.length).toBe(8);
      const keys = INSET_ANCHOR_POSITIONS.map((p) => p.key);
      expect(keys).toEqual([
        "top-left",
        "top-center",
        "top-right",
        "center-left",
        "center-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
      ]);
      const shortLabels = INSET_ANCHOR_POSITIONS.map((p) => p.shortLabel);
      expect(shortLabels).toEqual([
        "TL",
        "TC",
        "TR",
        "CL",
        "CR",
        "BL",
        "BC",
        "BR",
      ]);
    });
  });

  describe("extractDroppedWidgetKey", () => {
    it("should return undefined if no dataTransfer", () => {
      const event = {} as DragEvent;
      expect(
        LaneColumnInsetHelper.extractDroppedWidgetKey(event),
      ).toBeUndefined();
    });

    it("should extract key from application/json payload with key property", () => {
      const mockEvent = {
        dataTransfer: {
          getData: (format: string) => {
            if (format === "application/json") {
              return JSON.stringify({ key: "custom:dopamine:advanced-laps" });
            }
            return "";
          },
        },
      } as unknown as DragEvent;

      expect(LaneColumnInsetHelper.extractDroppedWidgetKey(mockEvent)).toBe(
        "custom:dopamine:advanced-laps",
      );
    });

    it("should extract type with lane-col: prefix stripped from application/json", () => {
      const mockEvent = {
        dataTransfer: {
          getData: (format: string) => {
            if (format === "application/json") {
              return JSON.stringify({ type: "lane-col:bestLapTime" });
            }
            return "";
          },
        },
      } as unknown as DragEvent;

      expect(LaneColumnInsetHelper.extractDroppedWidgetKey(mockEvent)).toBe(
        "bestLapTime",
      );
    });

    it("should extract from text/plain with lane-col: prefix stripped", () => {
      const mockEvent = {
        dataTransfer: {
          getData: (format: string) => {
            if (format === "text/plain") {
              return "lane-col:driver.nickname";
            }
            return "";
          },
        },
      } as unknown as DragEvent;

      expect(LaneColumnInsetHelper.extractDroppedWidgetKey(mockEvent)).toBe(
        "driver.nickname",
      );
    });

    it("should extract raw text/plain if no prefix", () => {
      const mockEvent = {
        dataTransfer: {
          getData: (format: string) => {
            if (format === "text/plain") {
              return "custom:my-widget";
            }
            return "";
          },
        },
      } as unknown as DragEvent;

      expect(LaneColumnInsetHelper.extractDroppedWidgetKey(mockEvent)).toBe(
        "custom:my-widget",
      );
    });

    it("should handle invalid JSON gracefully and fallback to text/plain", () => {
      const mockEvent = {
        dataTransfer: {
          getData: (format: string) => {
            if (format === "application/json") {
              return "{invalid json";
            }
            if (format === "text/plain") {
              return "lane-col:lastLapTime";
            }
            return "";
          },
        },
      } as unknown as DragEvent;

      expect(LaneColumnInsetHelper.extractDroppedWidgetKey(mockEvent)).toBe(
        "lastLapTime",
      );
    });
  });

  describe("getWidgetDisplayName", () => {
    it("should return empty string for falsy key", () => {
      expect(LaneColumnInsetHelper.getWidgetDisplayName("", [])).toBe("");
    });

    it("should return custom widget manifest name if registered", () => {
      const mockCustomService = {
        getWidgetDefinition: (key: string) => {
          if (key === "custom:dopamine:advanced-laps") {
            return { manifest: { name: "Advanced Laps" } };
          }
          return undefined;
        },
      } as any;

      expect(
        LaneColumnInsetHelper.getWidgetDisplayName(
          "custom:dopamine:advanced-laps",
          [],
          mockCustomService,
        ),
      ).toBe("Advanced Laps");
    });

    it("should strip custom: prefix if definition has no manifest name", () => {
      expect(
        LaneColumnInsetHelper.getWidgetDisplayName(
          "custom:unknown-widget",
          [],
          undefined,
        ),
      ).toBe("unknown-widget");
    });

    it("should translate column label when found in availableColumns", () => {
      const mockTranslation = {
        translate: (k: string) => (k === "RD_COL_BEST_LAP" ? "Best Lap" : k),
      } as any;
      const columns = [{ key: "bestLapTime", label: "RD_COL_BEST_LAP" }];

      expect(
        LaneColumnInsetHelper.getWidgetDisplayName(
          "bestLapTime",
          columns,
          undefined,
          mockTranslation,
        ),
      ).toBe("Best Lap");
    });

    it("should return col.label if no translationService provided", () => {
      const columns = [{ key: "bestLapTime", label: "Best Lap Label" }];
      expect(
        LaneColumnInsetHelper.getWidgetDisplayName("bestLapTime", columns),
      ).toBe("Best Lap Label");
    });

    it("should fallback to key if column not found", () => {
      expect(
        LaneColumnInsetHelper.getWidgetDisplayName("unregisteredKey", []),
      ).toBe("unregisteredKey");
    });
  });

  describe("getWidgetIcon", () => {
    it("should return add_circle_outline for empty key", () => {
      expect(LaneColumnInsetHelper.getWidgetIcon("")).toBe(
        "add_circle_outline",
      );
    });

    it("should return extension for custom widgets", () => {
      expect(LaneColumnInsetHelper.getWidgetIcon("custom:my-widget")).toBe(
        "extension",
      );
    });

    it("should return schedule for time properties", () => {
      expect(LaneColumnInsetHelper.getWidgetIcon("bestLapTime")).toBe(
        "schedule",
      );
      expect(LaneColumnInsetHelper.getWidgetIcon("totalTime")).toBe("schedule");
      expect(LaneColumnInsetHelper.getWidgetIcon("segmentTime")).toBe(
        "schedule",
      );
    });

    it("should return flag for lap properties", () => {
      expect(LaneColumnInsetHelper.getWidgetIcon("lapCount")).toBe("flag");
      expect(LaneColumnInsetHelper.getWidgetIcon("heatTotalLaps")).toBe("flag");
    });

    it("should return person for driver properties", () => {
      expect(LaneColumnInsetHelper.getWidgetIcon("driver.name")).toBe("person");
      expect(LaneColumnInsetHelper.getWidgetIcon("participant.team.name")).toBe(
        "person",
      );
    });

    it("should return leaderboard for rank and gap properties", () => {
      expect(LaneColumnInsetHelper.getWidgetIcon("rank")).toBe("leaderboard");
      expect(LaneColumnInsetHelper.getWidgetIcon("gapLeader")).toBe(
        "leaderboard",
      );
      expect(LaneColumnInsetHelper.getWidgetIcon("seed")).toBe("leaderboard");
    });

    it("should return local_gas_station for fuel properties", () => {
      expect(LaneColumnInsetHelper.getWidgetIcon("fuelLevel")).toBe(
        "local_gas_station",
      );
    });

    it("should return speed for speed properties", () => {
      expect(LaneColumnInsetHelper.getWidgetIcon("mph")).toBe("speed");
      expect(LaneColumnInsetHelper.getWidgetIcon("averageSpeed_kph")).toBe(
        "speed",
      );
    });

    it("should return image for image, flag, and qrCode properties", () => {
      expect(LaneColumnInsetHelper.getWidgetIcon("imageset_avatar")).toBe(
        "image",
      );
      expect(LaneColumnInsetHelper.getWidgetIcon("flag")).toBe("image");
      expect(LaneColumnInsetHelper.getWidgetIcon("qrCode")).toBe("image");
    });

    it("should fallback to widgets for other properties", () => {
      expect(LaneColumnInsetHelper.getWidgetIcon("customOther")).toBe(
        "widgets",
      );
    });
  });

  describe("isCustomWidget and isImageProperty", () => {
    it("should correctly identify custom widgets", () => {
      expect(
        LaneColumnInsetHelper.isCustomWidget("custom:dopamine:advanced-laps"),
      ).toBeTrue();
      expect(LaneColumnInsetHelper.isCustomWidget("bestLapTime")).toBeFalse();
      expect(LaneColumnInsetHelper.isCustomWidget(undefined)).toBeFalse();
    });

    it("should correctly identify image properties", () => {
      expect(
        LaneColumnInsetHelper.isImageProperty("imageset_avatar"),
      ).toBeTrue();
      expect(
        LaneColumnInsetHelper.isImageProperty("driver.avatarUrl"),
      ).toBeTrue();
      expect(LaneColumnInsetHelper.isImageProperty("flag")).toBeTrue();
      expect(LaneColumnInsetHelper.isImageProperty("qrCode")).toBeTrue();
      expect(
        LaneColumnInsetHelper.isImageProperty("driverViewQrCode"),
      ).toBeTrue();
      expect(LaneColumnInsetHelper.isImageProperty("lastLapTime")).toBeFalse();
      expect(LaneColumnInsetHelper.isImageProperty(undefined)).toBeFalse();
    });
  });

  describe("Inset Config Getters and Setters", () => {
    let settings: any;

    beforeEach(() => {
      settings = {};
    });

    it("should create insetsConfig object if missing and get/set time display format", () => {
      expect(
        LaneColumnInsetHelper.getInsetTimeDisplayFormat(settings, "top-left"),
      ).toBe("dynamic");
      LaneColumnInsetHelper.setInsetTimeDisplayFormat(
        settings,
        "top-left",
        "mm_ss",
      );
      expect(
        LaneColumnInsetHelper.getInsetTimeDisplayFormat(settings, "top-left"),
      ).toBe("mm_ss");
    });

    it("should get and set subsecond mode, threshold, and decimals", () => {
      expect(
        LaneColumnInsetHelper.getInsetTimeSubsecondMode(settings, "top-right"),
      ).toBe("never");
      LaneColumnInsetHelper.setInsetTimeSubsecondMode(
        settings,
        "top-right",
        "threshold",
      );
      expect(
        LaneColumnInsetHelper.getInsetTimeSubsecondMode(settings, "top-right"),
      ).toBe("threshold");

      expect(
        LaneColumnInsetHelper.getInsetTimeSubsecondThreshold(
          settings,
          "top-right",
        ),
      ).toBe(10);
      LaneColumnInsetHelper.setInsetTimeSubsecondThreshold(
        settings,
        "top-right",
        15,
      );
      expect(
        LaneColumnInsetHelper.getInsetTimeSubsecondThreshold(
          settings,
          "top-right",
        ),
      ).toBe(15);

      expect(
        LaneColumnInsetHelper.getInsetTimeSubsecondDecimals(
          settings,
          "top-right",
        ),
      ).toBe(2);
      LaneColumnInsetHelper.setInsetTimeSubsecondDecimals(
        settings,
        "top-right",
        3,
      );
      expect(
        LaneColumnInsetHelper.getInsetTimeSubsecondDecimals(
          settings,
          "top-right",
        ),
      ).toBe(3);
    });

    it("should get and set font family, size, and text color", () => {
      settings.insetFontFamily = "Roboto";
      settings.insetFontSize = 16;
      settings.insetTextColor = "#cccccc";

      expect(
        LaneColumnInsetHelper.getInsetFontFamily(settings, "bottom-left"),
      ).toBe("Roboto");
      LaneColumnInsetHelper.setInsetFontFamily(
        settings,
        "bottom-left",
        "Consolas",
      );
      expect(
        LaneColumnInsetHelper.getInsetFontFamily(settings, "bottom-left"),
      ).toBe("Consolas");

      expect(
        LaneColumnInsetHelper.getInsetFontSize(settings, "bottom-left"),
      ).toBe(16);
      LaneColumnInsetHelper.setInsetFontSize(settings, "bottom-left", 22);
      expect(
        LaneColumnInsetHelper.getInsetFontSize(settings, "bottom-left"),
      ).toBe(22);

      expect(
        LaneColumnInsetHelper.getInsetTextColor(settings, "bottom-left"),
      ).toBe("#cccccc");
      LaneColumnInsetHelper.setInsetTextColor(
        settings,
        "bottom-left",
        "#ff0000",
      );
      expect(
        LaneColumnInsetHelper.getInsetTextColor(settings, "bottom-left"),
      ).toBe("#ff0000");
    });

    it("should format preview timer value", () => {
      LaneColumnInsetHelper.setInsetTimeDisplayFormat(
        settings,
        "top-left",
        "mm_ss",
      );
      const preview = LaneColumnInsetHelper.getInsetPreview(
        settings,
        "top-left",
        75,
      );
      expect(preview).toContain("01:15");
    });
  });
});
