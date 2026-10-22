import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";

import {
  buildSyntheticInsetWidgetInputs,
  buildSyntheticMainWidgetInputs,
  extractDroppedColumnKey,
  fitColumnTextValue,
  formatAdjustedLapValue,
  getInsetDefaultAlignment,
  getSharedCanvasContext,
  getSvgPreserveAspectRatio,
  isCustomWidgetKey,
  isEditorMode,
  isLaneColumnImageProperty,
  isOverallDataSource,
  isParentRaceOver,
  resolveColumnHeaderLabel,
  resolveHeatGridDriver,
  resolveLaneColumnImageUrl,
  resolveOverallGridDriver,
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

    it("should return true when columnKey is an overall column key without explicit gridType on standalone widgets", () => {
      expect(
        isOverallDataSource({ columnKey: "overallLapCount" } as any),
      ).toBeTrue();
      expect(
        isOverallDataSource({ columnKey: "rankOverall" } as any),
      ).toBeTrue();
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
      expect(numSize).toBeLessThanOrEqual(40);
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
      expect(getSvgPreserveAspectRatio("bottom-right")).toBe("xMaxYMax meet");
      expect(getSvgPreserveAspectRatio(undefined)).toBe("xMidYMid meet");
      expect(getSvgPreserveAspectRatio("unknown")).toBe("xMidYMid meet");
    });
  });
});
