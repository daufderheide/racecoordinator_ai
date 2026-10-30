import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";

import {
  buildSyntheticInsetWidgetInputs,
  buildSyntheticMainWidgetInputs,
  computeHeatDataLastLaps,
  computeLastLapItemStyle,
  computeLastLapTimeStyle,
  extractDroppedColumnKey,
  fitColumnLastLaps,
  fitColumnTextValue,
  formatAdjustedLapValue,
  getInsetDefaultAlignment,
  getInsetDefaultVerticalAlignment,
  getSharedCanvasContext,
  getSvgPreserveAspectRatio,
  isCustomWidgetKey,
  isEditorMode,
  isLaneColumnImageProperty,
  isOverallDataSource,
  isParentRaceOver,
  resolveCardFontFamily,
  resolveColumnHeaderLabel,
  resolveEffectiveHeaderFontSize,
  resolveHeatGridDriver,
  resolveLaneColumnImageUrl,
  resolveOverallGridDriver,
  safeguardTextOverflow,
} from "./raceday-lane-column.utils";

describe("raceday-lane-column.utils", () => {
  describe("isCustomWidgetKey", () => {
    it("should return true for keys starting with custom:", () => {
      expect(isCustomWidgetKey("custom:fuel-gauge")).toBeTrue();
      expect(isCustomWidgetKey("custom:")).toBeTrue();
    });

    it("should return false for standard column keys or empty string", () => {
      expect(isCustomWidgetKey("bestLapTime")).toBeFalse();
      expect(isCustomWidgetKey("")).toBeFalse();
      expect(isCustomWidgetKey(undefined)).toBeFalse();
    });
  });

  describe("buildSyntheticMainWidgetInputs", () => {
    it("should construct synthetic inputs with showHeader: false and targetIndex", () => {
      const widget: any = {
        id: "w1",
        widgetType: "lane-column",
        customSettings: {
          testParam: 42,
        },
      };

      const result = buildSyntheticMainWidgetInputs(
        "custom:my-widget",
        widget,
        "lane",
        3,
        { parentProp: true },
        false,
      );

      expect(result.widget.id).toBe("w1-main");
      expect(result.widget.widgetType).toBe("custom:my-widget" as any);
      expect(result.widget.customSettings?.["showHeader"]).toBeFalse();
      expect(result.widget.customSettings?.["bindingMode"]).toBe("lane");
      expect(result.widget.customSettings?.["gridLane"]).toBe(3);
      expect(result.widget.customSettings?.["targetIndex"]).toBe(4);
      expect(result.widget.customSettings?.["testParam"]).toBe(42);
      expect(result.parent.parentProp).toBeTrue();
      expect(result.isCustomizing).toBeFalse();
    });

    it("should pass targetDriver, laneForegroundColor, and laneBackgroundColor into customSettings", () => {
      const widget: any = {
        id: "w1",
        widgetType: "lane-column",
        customSettings: {},
      };
      const mockDriver = { name: "Driver 2", laneIndex: 2 };

      const result = buildSyntheticMainWidgetInputs(
        "custom:advanced-laps",
        widget,
        "lane",
        0,
        null,
        false,
        mockDriver,
        "#000000",
        "#3b82f6",
      );

      expect(result.widget.customSettings?.["targetDriver"]).toBe(mockDriver);
      expect(result.widget.customSettings?.["laneForegroundColor"]).toBe(
        "#000000",
      );
      expect(result.widget.customSettings?.["laneBackgroundColor"]).toBe(
        "#3b82f6",
      );
    });

    it("should handle null widget gracefully", () => {
      const result = buildSyntheticMainWidgetInputs(
        "custom:fallback",
        null,
        "position",
        0,
        null,
        true,
      );

      expect(result.widget.id).toBe("lane-col-main");
      expect(result.widget.widgetType).toBe("custom:fallback" as any);
      expect(result.widget.customSettings?.["showHeader"]).toBeFalse();
      expect(result.widget.customSettings?.["gridLane"]).toBe(0);
      expect(result.isCustomizing).toBeTrue();
    });
  });

  describe("buildSyntheticInsetWidgetInputs", () => {
    it("should construct synthetic inset inputs with insetsConfig overrides", () => {
      const widget: any = {
        id: "w1",
        customSettings: {
          insetsConfig: {
            "top-right": {
              customProp: "inset-val",
            },
          },
        },
      };

      const result = buildSyntheticInsetWidgetInputs(
        "top-right",
        "custom:inset-widget",
        widget,
        "lane",
        1,
        14,
        null,
        false,
      );

      expect(result.widget.id).toBe("w1-inset-top-right");
      expect(result.widget.widgetType).toBe("custom:inset-widget" as any);
      expect(result.widget.customSettings?.["customProp"]).toBe("inset-val");
      expect(result.widget.customSettings?.["showHeader"]).toBeFalse();
      expect(result.widget.customSettings?.["valueFontSize"]).toBe(14);
      expect(result.widget.customSettings?.["gridLane"]).toBe(1);
      expect(result.widget.customSettings?.["decimalPlaces"]).toBe(2);
      expect(result.widget.customSettings?.["lapDecimalPlaces"]).toBe(2);
      expect(result.widget.customSettings?.["valueAlignment"]).toBe("right");
    });

    it("should inherit parent insetLapDecimalPlaces when anchor decimals are omitted", () => {
      const widget: any = {
        id: "w-parent",
        customSettings: {
          insetLapDecimalPlaces: 3,
          insetTimeDecimalPlaces: 1,
          insetsConfig: {
            "bottom-right": {
              mode: "overall",
            },
          },
        },
      };

      const result = buildSyntheticInsetWidgetInputs(
        "bottom-right",
        "custom:dopamine:advanced-laps",
        widget,
        "lane",
        0,
        18,
        null,
        false,
      );

      expect(result.widget.customSettings?.["decimalPlaces"]).toBe(3);
      expect(result.widget.customSettings?.["lapDecimalPlaces"]).toBe(3);
      expect(result.widget.customSettings?.["insetLapDecimalPlaces"]).toBe(3);
      expect(result.widget.customSettings?.["insetTimeDecimalPlaces"]).toBe(1);
      expect(result.widget.customSettings?.["valueAlignment"]).toBe("right");
    });

    it("should honor explicit valueAlignment in insetsConfig", () => {
      const widget: any = {
        id: "w-align",
        customSettings: {
          insetsConfig: {
            "top-left": {
              valueAlignment: "center",
            },
          },
        },
      };

      const result = buildSyntheticInsetWidgetInputs(
        "top-left",
        "custom:dopamine:advanced-laps",
        widget,
        "lane",
        0,
        18,
        null,
        false,
      );

      expect(result.widget.customSettings?.["valueAlignment"]).toBe("center");
    });

    it("should prioritize anchorCfg.decimalPlaces or lapDecimalPlaces over parent insetLapDecimalPlaces", () => {
      const widget: any = {
        id: "w-override",
        customSettings: {
          insetLapDecimalPlaces: 3,
          insetsConfig: {
            "bottom-right": {
              mode: "overall",
              decimalPlaces: 0,
            },
          },
        },
      };

      const result = buildSyntheticInsetWidgetInputs(
        "bottom-right",
        "custom:dopamine:advanced-laps",
        widget,
        "lane",
        0,
        18,
        null,
        false,
      );

      expect(result.widget.customSettings?.["decimalPlaces"]).toBe(0);
      expect(result.widget.customSettings?.["lapDecimalPlaces"]).toBe(0);
    });

    it("should pass targetDriver, laneForegroundColor, and laneBackgroundColor into customSettings", () => {
      const widget: any = {
        id: "w-colors",
        customSettings: {},
      };
      const mockDriver = { name: "Driver 1", laneIndex: 1 };

      const result = buildSyntheticInsetWidgetInputs(
        "bottom-right",
        "custom:advanced-laps",
        widget,
        "overallPosition",
        1,
        14,
        null,
        false,
        mockDriver,
        "#000000",
        "#ffffff",
      );

      expect(result.widget.customSettings?.["targetDriver"]).toBe(mockDriver);
      expect(result.widget.customSettings?.["laneForegroundColor"]).toBe(
        "#000000",
      );
      expect(result.widget.customSettings?.["laneBackgroundColor"]).toBe(
        "#ffffff",
      );
    });

    it("should set horizontalAlignment, verticalAlignment, and valueAlignment in customSettings", () => {
      const widget: any = {
        customSettings: {
          insetsConfig: {
            "top-left": {
              horizontalAlignment: "right",
              verticalAlignment: "bottom",
            },
          },
        },
      };
      const result = buildSyntheticInsetWidgetInputs(
        "top-left",
        "custom:advanced-laps",
        widget,
        "lane",
        0,
        14,
        null,
        false,
      );
      expect(result.widget.customSettings?.["horizontalAlignment"]).toBe(
        "right",
      );
      expect(result.widget.customSettings?.["verticalAlignment"]).toBe(
        "bottom",
      );
      expect(result.widget.customSettings?.["valueAlignment"]).toBe("right");
    });
  });

  describe("getInsetDefaultAlignment", () => {
    it("should return left for left-positioned anchors", () => {
      expect(getInsetDefaultAlignment("top-left")).toBe("left");
      expect(getInsetDefaultAlignment("center-left")).toBe("left");
      expect(getInsetDefaultAlignment("bottom-left")).toBe("left");
    });

    it("should return right for right-positioned anchors", () => {
      expect(getInsetDefaultAlignment("top-right")).toBe("right");
      expect(getInsetDefaultAlignment("center-right")).toBe("right");
      expect(getInsetDefaultAlignment("bottom-right")).toBe("right");
    });

    it("should return center for center-positioned anchors", () => {
      expect(getInsetDefaultAlignment("top-center")).toBe("center");
      expect(getInsetDefaultAlignment("bottom-center")).toBe("center");
    });
  });

  describe("getInsetDefaultVerticalAlignment", () => {
    it("should return top for top-positioned anchors", () => {
      expect(getInsetDefaultVerticalAlignment("top-left")).toBe("top");
      expect(getInsetDefaultVerticalAlignment("top-center")).toBe("top");
      expect(getInsetDefaultVerticalAlignment("top-right")).toBe("top");
    });

    it("should return bottom for bottom-positioned anchors", () => {
      expect(getInsetDefaultVerticalAlignment("bottom-left")).toBe("bottom");
      expect(getInsetDefaultVerticalAlignment("bottom-center")).toBe("bottom");
      expect(getInsetDefaultVerticalAlignment("bottom-right")).toBe("bottom");
    });

    it("should return center for center-positioned anchors", () => {
      expect(getInsetDefaultVerticalAlignment("center-left")).toBe("center");
      expect(getInsetDefaultVerticalAlignment("center-right")).toBe("center");
    });
  });

  describe("resolveColumnHeaderLabel", () => {
    it("should resolve custom widget label from service manifest", () => {
      const mockParent = {
        customWidgetService: {
          getWidgetDefinition: (key: string) => {
            if (key === "custom:fuel") {
              return { manifest: { name: "Fuel Gauge" } };
            }
            return null;
          },
        },
      } as any;

      const label = resolveColumnHeaderLabel(
        "custom:fuel",
        {} as any,
        mockParent,
        (k) => k,
      );
      expect(label).toBe("Fuel Gauge");

      const fallbackLabel = resolveColumnHeaderLabel(
        "custom:unknown_widget",
        {} as any,
        mockParent,
        (k) => k,
      );
      expect(fallbackLabel).toBe("unknown_widget");
    });

    it("should resolve customLabel if specified", () => {
      const label = resolveColumnHeaderLabel(
        "bestLapTime",
        { customLabel: "My Best Lap" } as any,
        {},
        (k) => k,
      );
      expect(label).toBe("My Best Lap");
    });

    it("should resolve RD_COL_HEATS_REMAINING when heatsDisplayMode is remaining and no customLabel", () => {
      const label = resolveColumnHeaderLabel(
        "heatsRaced",
        { heatsDisplayMode: "remaining" } as any,
        {},
        (k) => k,
      );
      expect(label).toBe("RD_COL_HEATS_REMAINING");
    });

    it("should resolve RD_COL_HEATS_RACED when heatsDisplayMode is raced and no customLabel", () => {
      const label = resolveColumnHeaderLabel(
        "heatsRaced",
        { heatsDisplayMode: "raced" } as any,
        {},
        (k) => k,
      );
      expect(label).toBe("RD_COL_HEATS_RACED");
    });
  });

  describe("formatAdjustedLapValue", () => {
    it("should return -- if raw is null", () => {
      expect(formatAdjustedLapValue(null, {} as any, "lapCount")).toBe("--");
    });

    it("should return raw value when no autoCalculatedLaps", () => {
      const hd: any = { autoCalculatedLaps: 0, isFinished: false };
      expect(formatAdjustedLapValue(10, hd, "lapCount")).toBe("10");
    });

    it("should adjust lap value when autoCalculatedLaps > 0 and not finished", () => {
      const hd: any = { autoCalculatedLaps: 2, isFinished: false };
      expect(formatAdjustedLapValue(10, hd, "lapCount")).toBe("8");
    });
  });

  describe("isParentRaceOver", () => {
    it("should return false if parent is undefined", () => {
      expect(isParentRaceOver(undefined)).toBeFalse();
    });

    it("should prioritize parent.isRaceOver() if defined", () => {
      expect(isParentRaceOver({ isRaceOver: () => true })).toBeTrue();
      expect(isParentRaceOver({ isRaceOver: () => false })).toBeFalse();
    });

    it("should check parent.raceState", () => {
      expect(isParentRaceOver({ raceState: RaceState.RACE_OVER })).toBeTrue();
      expect(isParentRaceOver({ raceState: RaceState.RACING })).toBeFalse();
    });

    it("should check parent.race.raceState", () => {
      expect(
        isParentRaceOver({ race: { raceState: RaceState.RACE_OVER } }),
      ).toBeTrue();
      expect(
        isParentRaceOver({ race: { raceState: RaceState.RACING } }),
      ).toBeFalse();
    });

    it("should check parent.raceService.getRace().raceState", () => {
      expect(
        isParentRaceOver({
          raceService: { getRace: () => ({ raceState: RaceState.RACE_OVER }) },
        }),
      ).toBeTrue();
    });
  });

  describe("isOverallDataSource", () => {
    it("should return true when gridType is overall", () => {
      expect(isOverallDataSource({ gridType: "overall" } as any)).toBeTrue();
    });

    it("should return true when parent gridSession has gridType overall", () => {
      const parent = { gridSession: () => ({ gridType: "overall" }) };
      expect(
        isOverallDataSource({ gridId: "grid-1" } as any, parent),
      ).toBeTrue();
    });

    it("should return true when bindingMode is overallPosition for standalone widgets", () => {
      expect(
        isOverallDataSource({ bindingMode: "overallPosition" } as any),
      ).toBeTrue();
      expect(
        isOverallDataSource({} as any, undefined, "overallPosition"),
      ).toBeTrue();
    });

    it("should return false when columnKey is an overall column key without explicit gridType on standalone widgets", () => {
      expect(
        isOverallDataSource({ columnKey: "overallLapCount" } as any),
      ).toBeFalse();
      expect(
        isOverallDataSource({ columnKey: "rankOverall" } as any),
      ).toBeFalse();
    });

    it("should return false when gridType is explicitly heat even with overallPosition or overall columns", () => {
      expect(
        isOverallDataSource({ gridType: "heat", columnKey: "lapCount" } as any),
      ).toBeFalse();
      expect(
        isOverallDataSource({
          gridType: "heat",
          gridId: "grid-1",
          bindingMode: "overallPosition",
        } as any),
      ).toBeFalse();
      expect(
        isOverallDataSource({
          gridType: "heat",
          gridId: "grid-1",
          columnKey: "overallLapCount",
        } as any),
      ).toBeFalse();
    });

    it("should return false for a grid with gridId that is not overall even if bindingMode is overallPosition", () => {
      expect(
        isOverallDataSource({
          gridId: "grid-1",
          bindingMode: "overallPosition",
        } as any),
      ).toBeFalse();
      expect(
        isOverallDataSource({
          gridId: "grid-1",
          columnKey: "overallLapCount",
        } as any),
      ).toBeFalse();
    });
  });

  describe("resolveOverallGridDriver when race is over", () => {
    const mockDriverInHeat = new DriverHeatData(
      "p1",
      { objectId: "p1", name: "Driver 1", rank: 1 } as any,
      0,
    );
    const mockDrivers = [mockDriverInHeat];
    const syntheticCreator = (p: any) =>
      new DriverHeatData(p.objectId, p, -1, p.driver);

    it("should return active heat driver with lane index during racing", () => {
      const parent = {
        participants: [{ objectId: "p1", rank: 1 }],
        raceState: RaceState.RACING,
      };

      const result = resolveOverallGridDriver(
        mockDrivers,
        parent,
        "overallPosition",
        0,
        syntheticCreator,
      );

      expect(result).toBe(mockDriverInHeat);
      expect(result?.laneIndex).toBe(0);
    });

    it("should consider all positions not in a lane (laneIndex -1) when race is over", () => {
      const parent = {
        participants: [{ objectId: "p1", rank: 1 }],
        raceState: RaceState.RACE_OVER,
      };

      const result = resolveOverallGridDriver(
        mockDrivers,
        parent,
        "overallPosition",
        0,
        syntheticCreator,
      );

      expect(result).not.toBe(mockDriverInHeat);
      expect(result?.laneIndex).toBe(-1);
    });
  });

  describe("isLaneColumnImageProperty", () => {
    it("should return true for standard image properties", () => {
      expect(isLaneColumnImageProperty("driver.avatarUrl")).toBeTrue();
      expect(isLaneColumnImageProperty("flag")).toBeTrue();
      expect(isLaneColumnImageProperty("qrCode")).toBeTrue();
      expect(isLaneColumnImageProperty("driverViewQrCode")).toBeTrue();
      expect(isLaneColumnImageProperty("imageset_sample")).toBeTrue();
    });

    it("should normalize and strip lane-col: prefix", () => {
      expect(isLaneColumnImageProperty("lane-col:driver.avatarUrl")).toBeTrue();
      expect(isLaneColumnImageProperty("lane-col:qrCode")).toBeTrue();
      expect(isLaneColumnImageProperty("lane-col:driverViewQrCode")).toBeTrue();
    });

    it("should return false for non-image properties", () => {
      expect(isLaneColumnImageProperty("driver.name")).toBeFalse();
      expect(isLaneColumnImageProperty("lapCount")).toBeFalse();
      expect(isLaneColumnImageProperty("")).toBeFalse();
    });
  });

  describe("resolveLaneColumnImageUrl", () => {
    const mockDriverWithAvatar = new DriverHeatData(
      "p1",
      {
        objectId: "p1",
        driver: {
          id: "d1",
          name: "Driver 1",
          avatarUrl: "avatars/driver1.png",
        },
      } as any,
      0,
    );

    const mockDriverWithoutAvatar = new DriverHeatData(
      "p2",
      {
        objectId: "p2",
        driver: { id: "d2", name: "Driver 2", avatarUrl: "" },
      } as any,
      1,
    );

    it("should return empty string if parent is undefined", () => {
      expect(
        resolveLaneColumnImageUrl(
          "driver.avatarUrl",
          mockDriverWithAvatar,
          undefined,
        ),
      ).toBe("");
    });

    it("should resolve driver.avatarUrl with full URL", () => {
      const parent = {
        getFullUrl: (url: string) => `http://server/${url}`,
        isUIEditorMode: false,
      };
      expect(
        resolveLaneColumnImageUrl(
          "driver.avatarUrl",
          mockDriverWithAvatar,
          parent,
        ),
      ).toBe("http://server/avatars/driver1.png");
    });

    it("should fallback to default avatar in UI Editor mode when driver has no avatar", () => {
      const parent = {
        getFullUrl: (url: string) => `http://server/${url}`,
        isUIEditorMode: true,
      };
      expect(
        resolveLaneColumnImageUrl(
          "driver.avatarUrl",
          mockDriverWithoutAvatar,
          parent,
        ),
      ).toBe("http://server/assets/images/default_avatar.svg");
    });

    it("should fallback to default avatar in UI Editor mode when targetDriver is undefined", () => {
      const parent = {
        getFullUrl: (url: string) => `http://server/${url}`,
        isUIEditorMode: true,
      };
      expect(
        resolveLaneColumnImageUrl("driver.avatarUrl", undefined, parent),
      ).toBe("http://server/assets/images/default_avatar.svg");
    });

    it("should fallback to default avatar for driver.avatarUrl when missing in race mode for valid driver", () => {
      const parent = {
        getFullUrl: (url: string) => `http://server/${url}`,
        isUIEditorMode: false,
      };
      expect(
        resolveLaneColumnImageUrl(
          "driver.avatarUrl",
          mockDriverWithoutAvatar,
          parent,
        ),
      ).toBe("http://server/assets/images/default_avatar.svg");
    });

    it("should return empty string for driver.avatarUrl in race mode when driver is empty or undefined", () => {
      const parent = {
        getFullUrl: (url: string) => `http://server/${url}`,
        isUIEditorMode: false,
      };
      const mockEmptyDriver = new DriverHeatData(
        "empty",
        {
          objectId: "empty",
          isEmpty: true,
        } as any,
        1,
      );
      expect(
        resolveLaneColumnImageUrl("driver.avatarUrl", mockEmptyDriver, parent),
      ).toBe("");
      expect(
        resolveLaneColumnImageUrl("driver.avatarUrl", undefined, parent),
      ).toBe("");
    });

    it("should resolve qrCode using parent.getLaneQrCodeUrl", () => {
      const parent = {
        getLaneQrCodeUrl: (lane: number) => `data:image/svg;lane=${lane}`,
        isUIEditorMode: false,
      };
      expect(
        resolveLaneColumnImageUrl("qrCode", mockDriverWithAvatar, parent),
      ).toBe("data:image/svg;lane=0");
    });

    it("should fallback to parent.qrCodeUrl in UI Editor mode for qrCode if cache is empty or driver is undefined", () => {
      const parent = {
        getLaneQrCodeUrl: () => "",
        qrCodeUrl: "data:image/svg;mock-qr",
        isUIEditorMode: true,
      };
      expect(
        resolveLaneColumnImageUrl("qrCode", undefined, parent, undefined, 2),
      ).toBe("data:image/svg;mock-qr");
    });

    it("should resolve driverViewQrCode by passing DriverHeatData object to getDriverViewQrCodeUrl", () => {
      let passedArg: any = null;
      const parent = {
        getDriverViewQrCodeUrl: (arg: any) => {
          passedArg = arg;
          return "data:image/svg;dv-qr";
        },
        isUIEditorMode: false,
      };
      const result = resolveLaneColumnImageUrl(
        "driverViewQrCode",
        mockDriverWithAvatar,
        parent,
      );
      expect(result).toBe("data:image/svg;dv-qr");
      expect(passedArg).toBe(mockDriverWithAvatar);
    });

    it("should fallback to parent.qrCodeUrl in UI Editor mode for driverViewQrCode if driver is undefined", () => {
      const parent = {
        getDriverViewQrCodeUrl: () => "",
        qrCodeUrl: "data:image/svg;mock-qr",
        isUIEditorMode: true,
      };
      expect(
        resolveLaneColumnImageUrl("driverViewQrCode", undefined, parent),
      ).toBe("data:image/svg;mock-qr");
    });

    it("should strip lane-col: prefix seamlessly", () => {
      const parent = {
        getFullUrl: (url: string) => `http://server/${url}`,
        isUIEditorMode: false,
      };
      expect(
        resolveLaneColumnImageUrl(
          "lane-col:driver.avatarUrl",
          mockDriverWithAvatar,
          parent,
        ),
      ).toBe("http://server/avatars/driver1.png");
    });

    it("should support isUIEditorMode as a signal function, a boolean, or isLayoutCustomizing", () => {
      const parentWithSignal = {
        getFullUrl: (url: string) => `http://server/${url}`,
        isUIEditorMode: () => true,
      };
      const parentWithBool = {
        getFullUrl: (url: string) => `http://server/${url}`,
        isUIEditorMode: true,
      };
      const parentWithCustomizing = {
        getFullUrl: (url: string) => `http://server/${url}`,
        isLayoutCustomizing: true,
      };

      expect(
        resolveLaneColumnImageUrl(
          "driver.avatarUrl",
          undefined,
          parentWithSignal,
        ),
      ).toBe("http://server/assets/images/default_avatar.svg");
      expect(
        resolveLaneColumnImageUrl(
          "driver.avatarUrl",
          undefined,
          parentWithBool,
        ),
      ).toBe("http://server/assets/images/default_avatar.svg");
      expect(
        resolveLaneColumnImageUrl(
          "driver.avatarUrl",
          undefined,
          parentWithCustomizing,
        ),
      ).toBe("http://server/assets/images/default_avatar.svg");
    });
  });

  describe("isEditorMode", () => {
    it("should return false when parent is undefined or null", () => {
      expect(isEditorMode(undefined)).toBeFalse();
      expect(isEditorMode(null)).toBeFalse();
    });

    it("should return true when isUIEditorMode is a function returning true", () => {
      expect(isEditorMode({ isUIEditorMode: () => true })).toBeTrue();
      expect(isEditorMode({ isUIEditorMode: () => false })).toBeFalse();
    });

    it("should return true when isUIEditorMode is a boolean true", () => {
      expect(isEditorMode({ isUIEditorMode: true })).toBeTrue();
      expect(isEditorMode({ isUIEditorMode: false })).toBeFalse();
    });

    it("should return true when isLayoutCustomizing is true", () => {
      expect(isEditorMode({ isLayoutCustomizing: true })).toBeTrue();
      expect(isEditorMode({ isLayoutCustomizing: false })).toBeFalse();
    });
  });

  describe("extractDroppedColumnKey", () => {
    it("should extract key from application/json payload and strip lane-col: prefix", () => {
      const event = {
        dataTransfer: {
          getData: (type: string) => {
            if (type === "application/json") {
              return JSON.stringify({ key: "lane-col:driver.avatarUrl" });
            }
            return "";
          },
        },
      } as any;

      expect(extractDroppedColumnKey(event, null)).toBe("driver.avatarUrl");
    });

    it("should extract type from application/json payload and strip lane-col: prefix", () => {
      const event = {
        dataTransfer: {
          getData: (type: string) => {
            if (type === "application/json") {
              return JSON.stringify({ type: "lane-col:qrCode" });
            }
            return "";
          },
        },
      } as any;

      expect(extractDroppedColumnKey(event, null)).toBe("qrCode");
    });

    it("should fallback to text/plain and strip lane-col: prefix", () => {
      const event = {
        dataTransfer: {
          getData: (type: string) => {
            if (type === "text/plain") return "lane-col:driverViewQrCode";
            return "";
          },
        },
      } as any;

      expect(extractDroppedColumnKey(event, null)).toBe("driverViewQrCode");
    });

    it("should fallback to parent.draggedWidgetType and strip lane-col: prefix", () => {
      const event = {
        dataTransfer: {
          getData: () => "",
        },
      } as any;
      const parent = { draggedWidgetType: "lane-col:flag" };

      expect(extractDroppedColumnKey(event, parent)).toBe("flag");
    });
  });

  describe("resolveHeatGridDriver editor mode fallback", () => {
    const mockDriverInHeat = new DriverHeatData(
      "p1",
      { objectId: "p1", name: "Driver 1" } as any,
      0,
    );
    const mockDrivers = [mockDriverInHeat];
    const syntheticCreator = (p: any) =>
      new DriverHeatData(p.objectId, p, -1, p.driver);

    it("should fallback to synthetic participant driver in UI Editor mode when targetIndex exceeds active drivers", () => {
      const parent = {
        participants: [
          { objectId: "p1", name: "Driver 1" },
          { objectId: "p2", name: "Driver 2" },
        ],
        isUIEditorMode: true,
      };

      const result = resolveHeatGridDriver(
        mockDrivers,
        parent,
        "lane",
        1,
        syntheticCreator,
      );

      expect(result).toBeDefined();
      expect(result?.objectId).toBe("p2");
    });
  });

  describe("fitColumnTextValue", () => {
    let cardEl: HTMLElement;

    beforeEach(() => {
      cardEl = document.createElement("div");
    });

    it("should return early when text is empty", () => {
      fitColumnTextValue(
        cardEl,
        "",
        { valueFontSize: 36 } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
      );
      expect(cardEl.style.getPropertyValue("--lane-col-value-font-size")).toBe(
        "",
      );
    });

    it("should set base font size and zero paddings when card dimensions are zero", () => {
      Object.defineProperty(cardEl, "clientWidth", {
        value: 0,
        configurable: true,
      });
      Object.defineProperty(cardEl, "clientHeight", {
        value: 0,
        configurable: true,
      });

      fitColumnTextValue(
        cardEl,
        "123",
        { valueFontSize: 42 } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
      );

      expect(cardEl.style.getPropertyValue("--lane-col-value-font-size")).toBe(
        "42px",
      );
      expect(cardEl.style.getPropertyValue("--lane-col-pad-left")).toBe("0px");
      expect(cardEl.style.getPropertyValue("--lane-col-pad-right")).toBe("0px");
    });

    it("should apply exact valueFontSize directly without height clamping in custom scaling mode (scaleMode: '')", () => {
      // Simulate a compact grid row (height: 25px)
      Object.defineProperty(cardEl, "clientWidth", {
        value: 120,
        configurable: true,
      });
      Object.defineProperty(cardEl, "clientHeight", {
        value: 25,
        configurable: true,
      });

      fitColumnTextValue(
        cardEl,
        "42",
        { valueFontSize: 72 } as any,
        "",
        "vertical",
        false,
        false,
        () => false,
        14,
      );

      // In custom scaling mode, font size must NOT be clamped to 25px
      expect(cardEl.style.getPropertyValue("--lane-col-value-font-size")).toBe(
        "72px",
      );
    });

    it("should apply exact valueFontSize directly in custom scaling mode (scaleMode: 'fixed')", () => {
      Object.defineProperty(cardEl, "clientWidth", {
        value: 120,
        configurable: true,
      });
      Object.defineProperty(cardEl, "clientHeight", {
        value: 25,
        configurable: true,
      });

      fitColumnTextValue(
        cardEl,
        "42",
        { valueFontSize: 60 } as any,
        "fixed",
        "vertical",
        false,
        false,
        () => false,
        14,
      );

      expect(cardEl.style.getPropertyValue("--lane-col-value-font-size")).toBe(
        "60px",
      );
    });

    it("should scale down font size in auto scaling mode when card height is smaller than base font size", () => {
      Object.defineProperty(cardEl, "clientWidth", {
        value: 120,
        configurable: true,
      });
      Object.defineProperty(cardEl, "clientHeight", {
        value: 25,
        configurable: true,
      });

      fitColumnTextValue(
        cardEl,
        "42",
        { valueFontSize: 72 } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
      );

      const sizeVar = cardEl.style.getPropertyValue(
        "--lane-col-value-font-size",
      );
      const numSize = parseInt(sizeVar, 10);
      expect(numSize).toBeLessThanOrEqual(25);
      expect(numSize).toBeGreaterThanOrEqual(10);
    });

    it("should auto-scale font size to available container height in auto mode even when valueFontSize is set small", () => {
      Object.defineProperty(cardEl, "clientWidth", {
        value: 200,
        configurable: true,
      });
      Object.defineProperty(cardEl, "clientHeight", {
        value: 100,
        configurable: true,
      });

      fitColumnTextValue(
        cardEl,
        "42",
        { valueFontSize: 12 } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
      );

      const sizeVar = cardEl.style.getPropertyValue(
        "--lane-col-value-font-size",
      );
      const numSize = parseInt(sizeVar, 10);
      expect(numSize).toBe(28);
    });

    it("should auto-scale grid column font size up to 54 in auto mode even when valueFontSize is set small", () => {
      Object.defineProperty(cardEl, "clientWidth", {
        value: 200,
        configurable: true,
      });
      Object.defineProperty(cardEl, "clientHeight", {
        value: 100,
        configurable: true,
      });

      fitColumnTextValue(
        cardEl,
        "42",
        { gridId: "grid-heat-data", valueFontSize: 12 } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
      );

      const sizeVar = cardEl.style.getPropertyValue(
        "--lane-col-value-font-size",
      );
      const numSize = parseInt(sizeVar, 10);
      expect(numSize).toBe(54);
    });

    it("should scale driver station cards to balanced readable proportions (value 84px, header 38px)", () => {
      const dsCardEl = document.createElement("div");
      Object.defineProperty(dsCardEl, "clientWidth", {
        value: 410,
        configurable: true,
      });
      Object.defineProperty(dsCardEl, "clientHeight", {
        value: 290,
        configurable: true,
      });

      fitColumnTextValue(
        dsCardEl,
        "42",
        { showHeader: true } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
      );

      const sizeVar = dsCardEl.style.getPropertyValue(
        "--lane-col-value-font-size",
      );
      const numSize = parseInt(sizeVar, 10);
      expect(numSize).toBe(84);

      const headerFont = resolveEffectiveHeaderFontSize(
        { showHeader: true } as any,
        { scaleMode: "auto" } as any,
        dsCardEl,
      );
      expect(headerFont).toBe(38);
    });

    it("should cap grid column font sizes to 54 for value and 24 for header on main raceday page", () => {
      const gridCardEl = document.createElement("div");
      Object.defineProperty(gridCardEl, "clientWidth", {
        value: 250,
        configurable: true,
      });
      Object.defineProperty(gridCardEl, "clientHeight", {
        value: 180,
        configurable: true,
      });

      fitColumnTextValue(
        gridCardEl,
        "42",
        { gridId: "grid-heat-data", showHeader: true } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
      );

      const sizeVar = gridCardEl.style.getPropertyValue(
        "--lane-col-value-font-size",
      );
      const numSize = parseInt(sizeVar, 10);
      expect(numSize).toBe(54);

      const headerFont = resolveEffectiveHeaderFontSize(
        { gridId: "grid-heat-data", showHeader: true } as any,
        { scaleMode: "auto" } as any,
        gridCardEl,
      );
      expect(headerFont).toBe(24);
    });

    it("should respect textScaleFactor in auto mode", () => {
      Object.defineProperty(cardEl, "clientWidth", {
        value: 200,
        configurable: true,
      });
      Object.defineProperty(cardEl, "clientHeight", {
        value: 100,
        configurable: true,
      });

      fitColumnTextValue(
        cardEl,
        "42",
        { valueFontSize: 12 } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
        undefined,
        undefined,
        0.5,
      );

      const sizeVar = cardEl.style.getPropertyValue(
        "--lane-col-value-font-size",
      );
      const numSize = parseInt(sizeVar, 10);
      expect(numSize).toBe(16);
    });

    it("should use explicitWidth and explicitHeight without reading card dimensions", () => {
      // cardEl has no clientWidth or clientHeight defined
      fitColumnTextValue(
        cardEl,
        "99.123",
        { valueFontSize: 40 } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
        200,
        80,
      );

      const sizeVar = cardEl.style.getPropertyValue(
        "--lane-col-value-font-size",
      );
      expect(sizeVar).toBeTruthy();
      const numSize = parseInt(sizeVar, 10);
      expect(numSize).toBeGreaterThanOrEqual(10);
      expect(numSize).toBe(22);
    });

    it("should allow two-digit numbers (10+) to maintain a large legible font size without excessive shrinkage compared to single digits", () => {
      // Test narrow cell e.g. 40px wide by 45px tall (typical position/lane column)
      const singleDigitCard = document.createElement("div");
      const doubleDigitCard = document.createElement("div");

      fitColumnTextValue(
        singleDigitCard,
        "5",
        { showHeader: false } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
        40,
        45,
      );

      fitColumnTextValue(
        doubleDigitCard,
        "10",
        { showHeader: false } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
        40,
        45,
      );

      const singleSize = parseInt(
        singleDigitCard.style.getPropertyValue("--lane-col-value-font-size"),
        10,
      );
      const doubleSize = parseInt(
        doubleDigitCard.style.getPropertyValue("--lane-col-value-font-size"),
        10,
      );

      // Single digit should be large (e.g. around 35px for 45px height)
      expect(singleSize).toBeGreaterThanOrEqual(28);
      // Two-digit "10" must not collapse to 10px minimum - it should remain close to single-digit size (>= 22px)
      expect(doubleSize).toBeGreaterThanOrEqual(22);
      expect(doubleSize / singleSize).toBeGreaterThan(0.65);
    });

    it("should allow longer driver names like 'Uncle Jon' to fill available width without collapsing to minSize", () => {
      // Cell width 110px by 45px tall
      fitColumnTextValue(
        cardEl,
        "Uncle Jon",
        { showHeader: false } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
        110,
        45,
      );

      const sizeVar = cardEl.style.getPropertyValue(
        "--lane-col-value-font-size",
      );
      const numSize = parseInt(sizeVar, 10);
      // Previously "Uncle Jon" collapsed all the way down to 10px due to 32px padding deduction!
      // Now it should stay comfortably above 18px and fill the available cell space.
      expect(numSize).toBeGreaterThanOrEqual(18);
    });

    it("should reduce font size when hasTeamName is true to allocate space for team name badge", () => {
      const cardWithoutTeam = document.createElement("div");
      const cardWithTeam = document.createElement("div");

      fitColumnTextValue(
        cardWithoutTeam,
        "The Girls",
        { gridId: "g1", showHeader: false } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
        180,
        50,
        1,
        false,
      );

      fitColumnTextValue(
        cardWithTeam,
        "The Girls",
        { gridId: "g1", showHeader: false } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
        180,
        50,
        1,
        true,
      );

      const sizeWithoutTeam = parseInt(
        cardWithoutTeam.style.getPropertyValue("--lane-col-value-font-size"),
        10,
      );
      const sizeWithTeam = parseInt(
        cardWithTeam.style.getPropertyValue("--lane-col-value-font-size"),
        10,
      );

      expect(sizeWithTeam).toBeLessThan(sizeWithoutTeam);
    });

    it("should allow driver and team names to wrap and fit at larger font size in auto scaleMode", () => {
      const card = document.createElement("div");
      const val = document.createElement("div");
      val.className = "lane-col-value";
      const txt = document.createElement("span");
      txt.className = "lane-col-text";
      val.appendChild(txt);
      card.appendChild(val);

      fitColumnTextValue(
        card,
        "Super Long Driver Name",
        { gridId: "g1", showHeader: false } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
        100,
        70,
        1,
        false,
        "driver.name",
      );

      expect(txt.style.whiteSpace).toBe("normal");
      expect(txt.style.wordBreak).toBe("break-word");
      const size = parseInt(
        card.style.getPropertyValue("--lane-col-value-font-size"),
        10,
      );
      expect(size).toBeGreaterThanOrEqual(14);
    });

    it("should never wrap numbers for lap counts, lap times, and gaps in auto scaleMode", () => {
      const card = document.createElement("div");
      const val = document.createElement("div");
      val.className = "lane-col-value";
      const txt = document.createElement("span");
      txt.className = "lane-col-text";
      val.appendChild(txt);
      card.appendChild(val);

      // Lap times should NOT wrap
      fitColumnTextValue(
        card,
        "1:23.456",
        { gridId: "g1", showHeader: false } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
        60,
        50,
        1,
        false,
        "lastLapTime",
      );
      expect(txt.style.whiteSpace).toBe("nowrap");

      // Lap counts should NOT wrap
      fitColumnTextValue(
        card,
        "150",
        { gridId: "g1", showHeader: false } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
        60,
        50,
        1,
        false,
        "lapCount",
      );
      expect(txt.style.whiteSpace).toBe("nowrap");

      // Gaps should NOT wrap
      fitColumnTextValue(
        card,
        "+0.456",
        { gridId: "g1", showHeader: false } as any,
        "auto",
        "vertical",
        false,
        false,
        () => false,
        14,
        60,
        50,
        1,
        false,
        "gapToLeader",
      );
      expect(txt.style.whiteSpace).toBe("nowrap");
    });
  });

  describe("resolveCardFontFamily", () => {
    it("should return settings.valueFontFamily when explicitly configured", () => {
      const card = document.createElement("div");
      const family = resolveCardFontFamily(card, {
        valueFontFamily: "Impact, fantasy",
      } as any);
      expect(family).toBe("Impact, fantasy");
    });

    it("should fallback to 'Inter', sans-serif when no custom family is set", () => {
      const card = document.createElement("div");
      const family = resolveCardFontFamily(card, {} as any);
      expect(family).toContain("Inter");
    });

    it("should respect inline card style fontFamily if set", () => {
      const card = document.createElement("div");
      card.style.fontFamily = "Courier, monospace";
      const family = resolveCardFontFamily(card, {} as any);
      expect(family).toBe("Courier, monospace");
    });

    it("should resolve computed style font-family when element is connected to DOM", () => {
      const parent = document.createElement("div");
      parent.style.fontFamily = "Tahoma, sans-serif";
      const card = document.createElement("div");
      parent.appendChild(card);
      document.body.appendChild(parent);

      const family = resolveCardFontFamily(card, {} as any);
      document.body.removeChild(parent);

      expect(family).toContain("Tahoma");
    });
  });

  describe("safeguardTextOverflow", () => {
    it("should return early when value element is missing or has zero width", () => {
      const card = document.createElement("div");
      safeguardTextOverflow(card, 30, 10);
      expect(card.style.getPropertyValue("--lane-col-value-font-size")).toBe(
        "",
      );
    });

    it("should not reduce font size when text fits within container width", () => {
      const card = document.createElement("div");
      const valueEl = document.createElement("div");
      valueEl.className = "lane-col-value";
      const textEl = document.createElement("span");
      textEl.className = "lane-col-text";
      card.appendChild(valueEl);
      valueEl.appendChild(textEl);

      Object.defineProperty(valueEl, "clientWidth", { value: 150 });
      Object.defineProperty(textEl, "scrollWidth", { value: 120 });

      card.style.setProperty("--lane-col-value-font-size", "40px");
      safeguardTextOverflow(card, 40, 10);
      expect(card.style.getPropertyValue("--lane-col-value-font-size")).toBe(
        "40px",
      );
    });

    it("should reduce font size proportionally when text overflows container width", () => {
      const card = document.createElement("div");
      const valueEl = document.createElement("div");
      valueEl.className = "lane-col-value";
      const textEl = document.createElement("span");
      textEl.className = "lane-col-text";
      card.appendChild(valueEl);
      valueEl.appendChild(textEl);

      Object.defineProperty(valueEl, "clientWidth", { value: 100 });
      Object.defineProperty(textEl, "scrollWidth", { value: 125 });

      card.style.setProperty("--lane-col-value-font-size", "50px");
      safeguardTextOverflow(card, 50, 10);
      expect(card.style.getPropertyValue("--lane-col-value-font-size")).toBe(
        "40px",
      );
    });

    it("should dynamically scale down font size in real DOM when text overflows container width", () => {
      const cardEl = document.createElement("div");
      cardEl.style.width = "180px";
      cardEl.style.fontFamily = "Tahoma, sans-serif";
      cardEl.style.fontWeight = "700";

      const valueEl = document.createElement("div");
      valueEl.className = "lane-col-value";
      valueEl.style.width = "100%";
      valueEl.style.fontSize = "var(--lane-col-value-font-size, 54px)";
      valueEl.style.display = "flex";
      valueEl.style.alignItems = "center";
      valueEl.style.overflow = "hidden";
      valueEl.style.whiteSpace = "nowrap";

      const textEl = document.createElement("span");
      textEl.className = "lane-col-text";
      textEl.style.display = "inline-block";
      textEl.style.maxWidth = "100%";
      textEl.style.overflow = "hidden";
      textEl.style.textOverflow = "ellipsis";
      textEl.style.whiteSpace = "nowrap";
      textEl.textContent = "Driver 1";

      valueEl.appendChild(textEl);
      cardEl.appendChild(valueEl);
      document.body.appendChild(cardEl);

      cardEl.style.setProperty("--lane-col-value-font-size", "54px");
      safeguardTextOverflow(cardEl, 54, 10);
      const resultingSize = cardEl.style.getPropertyValue(
        "--lane-col-value-font-size",
      );
      const scrollAfter = textEl.scrollWidth;
      const clientAfter = valueEl.clientWidth;

      document.body.removeChild(cardEl);
      expect(parseInt(resultingSize, 10)).toBeLessThan(54);
      expect(scrollAfter).toBeLessThanOrEqual(clientAfter);
    });
  });

  describe("getSharedCanvasContext", () => {
    it("should return a CanvasRenderingContext2D and reuse the same instance", () => {
      const ctx1 = getSharedCanvasContext();
      const ctx2 = getSharedCanvasContext();
      expect(ctx1).toBeTruthy();
      expect(ctx1).toBe(ctx2);
    });
  });

  describe("getSvgPreserveAspectRatio", () => {
    it("should return correct preserveAspectRatio strings for all anchors", () => {
      expect(getSvgPreserveAspectRatio("top-left")).toBe("xMinYMin meet");
      expect(getSvgPreserveAspectRatio("top-center")).toBe("xMidYMin meet");
      expect(getSvgPreserveAspectRatio("top-right")).toBe("xMaxYMin meet");
      expect(getSvgPreserveAspectRatio("center-left")).toBe("xMinYMid meet");
      expect(getSvgPreserveAspectRatio("center-right")).toBe("xMaxYMid meet");
      expect(getSvgPreserveAspectRatio("bottom-left")).toBe("xMinYMax meet");
      expect(getSvgPreserveAspectRatio("bottom-center")).toBe("xMidYMax meet");
      expect(getSvgPreserveAspectRatio(undefined)).toBe("xMidYMid meet");
      expect(getSvgPreserveAspectRatio("unknown")).toBe("xMidYMid meet");
    });

    it("should respect explicit horizontal and vertical alignment parameters", () => {
      expect(getSvgPreserveAspectRatio("top-left", "right", "bottom")).toBe(
        "xMaxYMax meet",
      );
      expect(getSvgPreserveAspectRatio("top-left", "center", "center")).toBe(
        "xMidYMid meet",
      );
      expect(getSvgPreserveAspectRatio("bottom-right", "left", "top")).toBe(
        "xMinYMin meet",
      );
    });
  });

  describe("computeHeatDataLastLaps", () => {
    it("should default to 5 laps when targetDriver is undefined and no parent laps exist", () => {
      const result = computeHeatDataLastLaps(undefined, {} as any, null);
      expect(result.length).toBe(5);
      expect(result.every((item) => item.lapTime === "--.---")).toBeTrue();
    });

    it("should honor custom lastLapsCount when targetDriver is undefined", () => {
      const result = computeHeatDataLastLaps(
        undefined,
        { lastLapsCount: 8, timeDecimalPlaces: 2 } as any,
        null,
      );
      expect(result.length).toBe(8);
      expect(result.every((item) => item.lapTime === "--.--")).toBeTrue();
    });

    it("should generate correct number of laps for driver with custom lastLapsCount", () => {
      const mockDriver: any = {
        lapTimes: [10.123, 9.876, 9.456, 9.234, 9.111, 8.999, 9.05],
        lapsWithDetails: [],
        bestLapTime: 8.999,
      };

      const result3 = computeHeatDataLastLaps(
        mockDriver,
        { lastLapsCount: 3, timeDecimalPlaces: 3 } as any,
        null,
      );
      expect(result3.length).toBe(3);
      // Last 3 completed laps: indices 5, 4, 3 (since n=7, loop i=1..3 -> index 7-1-1=5, 7-1-2=4, 7-1-3=3)
      expect(result3[0].lapNumber).toBe(6);
      expect(result3[0].lapTime).toBe("8.999");
      expect(result3[0].isBest).toBeTrue();

      const result10 = computeHeatDataLastLaps(
        mockDriver,
        { lastLapsCount: 10, timeDecimalPlaces: 2 } as any,
        null,
      );
      expect(result10.length).toBe(10);
    });

    it("should delegate to parent.getLastLaps with configured lastLapsCount", () => {
      const parent = {
        columns: [{ propertyName: "lastLaps" }],
        getLastLaps: jasmine.createSpy("getLastLaps").and.returnValue([
          { lapNumber: 3, lapTime: "9.500", isBest: false, segments: [] },
          { lapNumber: 2, lapTime: "9.600", isBest: false, segments: [] },
          { lapNumber: 1, lapTime: "9.700", isBest: true, segments: [] },
        ]),
      };

      const result = computeHeatDataLastLaps(
        undefined,
        { lastLapsCount: 3 } as any,
        parent,
      );
      expect(parent.getLastLaps).toHaveBeenCalledWith(
        undefined,
        parent.columns[0],
        "center-center",
        3,
      );
      expect(result.length).toBe(3);
    });
  });

  describe("fitColumnLastLaps", () => {
    it("should clamp totalLaps to maxConfiguredLaps", () => {
      const mockEl = { clientWidth: 400, clientHeight: 300 } as HTMLElement;
      const fit5 = fitColumnLastLaps(mockEl, true, 54, 10, 400, 300, 5);
      expect(fit5.maxLaps).toBeLessThanOrEqual(5);

      const fit10 = fitColumnLastLaps(mockEl, true, 54, 10, 400, 600, 10);
      expect(fit10.maxLaps).toBeLessThanOrEqual(10);
    });

    it("should handle horizontal flow with custom maxConfiguredLaps", () => {
      const mockEl = { clientWidth: 600, clientHeight: 100 } as HTMLElement;
      const fitHorizontal = fitColumnLastLaps(
        mockEl,
        false,
        48,
        4,
        600,
        100,
        4,
      );
      expect(fitHorizontal.maxLaps).toBeLessThanOrEqual(4);
      expect(fitHorizontal.fontSize).toBeGreaterThanOrEqual(12);
    });
  });

  describe("computeLastLapItemStyle", () => {
    const regularLap = {
      lapNumber: 2,
      lapTime: "8.500",
      isBest: false,
      segments: [],
    };
    const bestLap = {
      lapNumber: 1,
      lapTime: "7.200",
      isBest: true,
      segments: [],
    };

    it("should return no separator borders when lastLapsShowBorder is false", () => {
      const styles = computeLastLapItemStyle(
        regularLap,
        false,
        { lastLapsShowBorder: false },
        true,
        "#ffffff",
      );
      expect(styles["border-bottom"]).toBeUndefined();
      expect(styles["border-right"]).toBeUndefined();
      expect(styles["border"]).toBeUndefined();
    });

    it("should apply separator border in vertical flow when not last", () => {
      const styles = computeLastLapItemStyle(
        regularLap,
        false,
        {
          lastLapsShowBorder: true,
          lastLapsBorderMode: "separator",
          lastLapsBorderStyle: "dashed",
          lastLapsBorderWidth: 2,
          lastLapsBorderColor: "#38bdf8",
        },
        true,
        "#ffffff",
      );
      expect(styles["border-bottom"]).toBe("2px dashed #38bdf8");
      expect(styles["border-right"]).toBeUndefined();
    });

    it("should apply separator border in horizontal flow when not last", () => {
      const styles = computeLastLapItemStyle(
        regularLap,
        false,
        {
          lastLapsShowBorder: true,
          lastLapsBorderMode: "separator",
          lastLapsBorderStyle: "dotted",
          lastLapsBorderWidth: 1,
        },
        false,
        "#f8fafc",
      );
      expect(styles["border-right"]).toBe("1px dotted #f8fafc");
      expect(styles["border-bottom"]).toBeUndefined();
    });

    it("should not apply separator border to the last item", () => {
      const styles = computeLastLapItemStyle(
        regularLap,
        true,
        {
          lastLapsShowBorder: true,
          lastLapsBorderMode: "separator",
        },
        true,
        "#ffffff",
      );
      expect(styles["border-bottom"]).toBeUndefined();
      expect(styles["border-right"]).toBeUndefined();
    });

    it("should apply box border around every item in box mode", () => {
      const styles = computeLastLapItemStyle(
        regularLap,
        true,
        {
          lastLapsShowBorder: true,
          lastLapsBorderMode: "box",
          lastLapsBorderStyle: "solid",
          lastLapsBorderWidth: 2,
          lastLapsBorderColor: "#10b981",
          lastLapsBorderRadius: 8,
        },
        true,
        "#ffffff",
      );
      expect(styles["border"]).toBe("2px solid #10b981");
      expect(styles["border-radius"]).toBe("8px");
      expect(styles["padding"]).toBe("2px 6px");
      expect(styles["margin"]).toBe("0px");
      expect(styles["width"]).toBe("100%");
    });

    it("should configure border margin in separator mode for vertical and horizontal flow", () => {
      // Positive margin in vertical flow
      const vertPosStyles = computeLastLapItemStyle(
        regularLap,
        false,
        {
          lastLapsShowBorder: true,
          lastLapsBorderMode: "separator",
          lastLapsBorderMargin: 6,
        },
        true,
        "#ffffff",
      );
      expect(vertPosStyles["margin-left"]).toBe("6px");
      expect(vertPosStyles["margin-right"]).toBe("6px");
      expect(vertPosStyles["width"]).toBe("calc(100% - 12px)");

      // Negative margin in vertical flow
      const vertNegStyles = computeLastLapItemStyle(
        regularLap,
        false,
        {
          lastLapsShowBorder: true,
          lastLapsBorderMode: "separator",
          lastLapsBorderMargin: -3,
        },
        true,
        "#ffffff",
      );
      expect(vertNegStyles["margin-left"]).toBe("-3px");
      expect(vertNegStyles["margin-right"]).toBe("-3px");
      expect(vertNegStyles["width"]).toBe("calc(100% - -6px)");

      // Positive margin in horizontal flow
      const horizPosStyles = computeLastLapItemStyle(
        regularLap,
        false,
        {
          lastLapsShowBorder: true,
          lastLapsBorderMode: "separator",
          lastLapsBorderMargin: 4,
        },
        false,
        "#ffffff",
      );
      expect(horizPosStyles["margin-top"]).toBe("4px");
      expect(horizPosStyles["margin-bottom"]).toBe("4px");
      expect(horizPosStyles["height"]).toBe("calc(100% - 8px)");

      // Negative margin in horizontal flow
      const horizNegStyles = computeLastLapItemStyle(
        regularLap,
        false,
        {
          lastLapsShowBorder: true,
          lastLapsBorderMode: "separator",
          lastLapsBorderMargin: -2,
        },
        false,
        "#ffffff",
      );
      expect(horizNegStyles["margin-top"]).toBe("-2px");
      expect(horizNegStyles["margin-bottom"]).toBe("-2px");
      expect(horizNegStyles["height"]).toBe("calc(100% - -4px)");
    });

    it("should configure border margin in box mode for vertical and horizontal flow", () => {
      // Box mode with positive margin in vertical flow
      const boxVertStyles = computeLastLapItemStyle(
        regularLap,
        false,
        {
          lastLapsShowBorder: true,
          lastLapsBorderMode: "box",
          lastLapsBorderMargin: 5,
        },
        true,
        "#ffffff",
      );
      expect(boxVertStyles["margin"]).toBe("5px");
      expect(boxVertStyles["width"]).toBe("calc(100% - 10px)");

      // Box mode with negative margin in horizontal flow
      const boxHorizStyles = computeLastLapItemStyle(
        regularLap,
        false,
        {
          lastLapsShowBorder: true,
          lastLapsBorderMode: "box",
          lastLapsBorderMargin: -4,
        },
        false,
        "#ffffff",
      );
      expect(boxHorizStyles["margin"]).toBe("-4px");
      expect(boxHorizStyles["height"]).toBe("calc(100% - -8px)");

      // Box mode with 0 margin
      const boxZeroStyles = computeLastLapItemStyle(
        regularLap,
        false,
        {
          lastLapsShowBorder: true,
          lastLapsBorderMode: "box",
          lastLapsBorderMargin: 0,
        },
        true,
        "#ffffff",
      );
      expect(boxZeroStyles["margin"]).toBe("0px");
      expect(boxZeroStyles["width"]).toBe("100%");
    });

    it("should apply best lap styling when lap is best and highlight is enabled", () => {
      const styles = computeLastLapItemStyle(
        bestLap,
        false,
        {
          lastLapsBestLapHighlight: true,
          lastLapsBestLapTextColor: "#10b981",
          lastLapsBestLapBackgroundColor: "rgba(16, 185, 129, 0.2)",
          lastLapsBestLapBorderRadius: 6,
          lastLapsBestLapShowBorder: true,
          lastLapsBestLapBorderColor: "#059669",
          lastLapsBestLapBorderStyle: "double",
          lastLapsBestLapBorderWidth: 3,
        },
        true,
        "#ffffff",
      );
      expect(styles["color"]).toBe("#10b981");
      expect(styles["background-color"]).toBe("rgba(16, 185, 129, 0.2)");
      expect(styles["border"]).toBe("3px double #059669");
      expect(styles["border-radius"]).toBe("6px");
      expect(styles["padding"]).toBe("2px 6px");
    });

    it("should ignore best lap styling when lastLapsBestLapHighlight is false", () => {
      const styles = computeLastLapItemStyle(
        bestLap,
        false,
        {
          lastLapsBestLapHighlight: false,
          lastLapsBestLapTextColor: "#10b981",
          lastLapsBestLapBackgroundColor: "rgba(16, 185, 129, 0.2)",
        },
        true,
        "#ffffff",
      );
      expect(styles["color"]).toBeUndefined();
      expect(styles["background-color"]).toBeUndefined();
    });

    it("should default border settings to column borders when lastLaps settings are omitted", () => {
      const styles = computeLastLapItemStyle(
        regularLap,
        false,
        {
          lastLapsShowBorder: true,
          showBorder: true,
          borderColor: "#ffffff",
          borderStyle: "dashed",
          borderWidth: 3,
          borderRadius: 12,
        },
        true,
        "#000000", // effectiveValueTextColor is black, but column border is white
        "#ffffff",
      );
      // Border should match the column border (3px dashed #ffffff), not the black text color
      expect(styles["border-bottom"]).toBe("3px dashed #ffffff");
    });

    it("should default border color to columnBorderColor parameter when neither lastLapsBorderColor nor borderColor is set", () => {
      const styles = computeLastLapItemStyle(
        regularLap,
        false,
        {
          lastLapsShowBorder: true,
        },
        true,
        "#000000",
        "#ffffff", // columnBorderColor passed
      );
      expect(styles["border-bottom"]).toBe("1px solid #ffffff");
    });

    it("should support custom valueAlignment start and end", () => {
      const stylesStart = computeLastLapItemStyle(
        regularLap,
        false,
        {
          valueAlignment: "start",
        },
        true,
        "#ffffff",
      );
      expect(stylesStart["justify-content"]).toBe("flex-start");
      expect(stylesStart["padding-left"]).toBe("6px");

      const stylesEnd = computeLastLapItemStyle(
        regularLap,
        false,
        {
          valueAlignment: "end",
        },
        true,
        "#ffffff",
      );
      expect(stylesEnd["justify-content"]).toBe("flex-end");
      expect(stylesEnd["padding-right"]).toBe("6px");
    });
  });

  describe("computeLastLapTimeStyle", () => {
    const regularLap = {
      lapNumber: 2,
      lapTime: "8.500",
      isBest: false,
      segments: [],
    };
    const bestLap = {
      lapNumber: 1,
      lapTime: "7.200",
      isBest: true,
      segments: [],
    };

    it("should return empty object for regular lap", () => {
      const styles = computeLastLapTimeStyle(regularLap, {
        lastLapsBestLapTextColor: "#10b981",
      });
      expect(styles).toEqual({});
    });

    it("should return empty object for best lap when highlight is disabled", () => {
      const styles = computeLastLapTimeStyle(bestLap, {
        lastLapsBestLapHighlight: false,
        lastLapsBestLapTextColor: "#10b981",
      });
      expect(styles).toEqual({});
    });

    it("should return configured best lap typography styles", () => {
      const styles = computeLastLapTimeStyle(bestLap, {
        lastLapsBestLapHighlight: true,
        lastLapsBestLapTextColor: "#eab308",
        lastLapsBestLapFontWeight: "bolder",
        lastLapsBestLapUnderline: true,
        lastLapsBestLapItalic: true,
      });
      expect(styles["color"]).toBe("#eab308");
      expect(styles["font-weight"]).toBe("900");
      expect(styles["text-decoration"]).toBe("underline");
      expect(styles["font-style"]).toBe("italic");
    });

    it("should handle normal font weight and no underline", () => {
      const styles = computeLastLapTimeStyle(bestLap, {
        lastLapsBestLapHighlight: true,
        lastLapsBestLapFontWeight: "normal",
        lastLapsBestLapUnderline: false,
      });
      expect(styles["font-weight"]).toBe("normal");
      expect(styles["text-decoration"]).toBe("none");
      expect(styles["font-style"]).toBeUndefined();
    });
  });
});
