import { Role } from "@app/models/role";
import { RaceState } from "@app/proto/antigravity";
import { DriverHeatData } from "@app/race/driver_heat_data";

import {
  applyLaneColumnLastLapsFit,
  deleteLaneColumnAnchor,
  fitLaneColumnHeaderText,
  formatLaneColumnInsetValue,
  handleLaneColumnCardClick,
  handleLaneColumnInsetClick,
  isLaneColumnInsetLapCount,
  isLaneColumnLapCountClickable,
  isLaneColumnPracticeLaneResetActive,
  isLaneColumnTeamDriverSwapActive,
  isNameOrNicknameProperty,
  notifyLaneColumnParentChange,
  resolveEffectiveHeaderFontSize,
  resolveEffectiveInsetFontSize,
  resolveHeatEmptyLaneIndex,
  resolveLaneColumnBackgroundColor,
  resolveLaneColumnCardTooltip,
  resolveLaneColumnForegroundColor,
  resolveLaneColumnFormattedValue,
  setLaneColumnInset,
} from "./raceday-lane-column-interaction.helper";

describe("raceday-lane-column-interaction.helper", () => {
  const mockTranslationService: any = {
    translate: jasmine.createSpy("translate").and.callFake((key: string) => {
      if (key === "RD_LAP_COLUMN_TOOLTIP") return "Edit Laps";
      if (key === "RD_PRACTICE_DRIVER_TOOLTIP") return "Practice Driver";
      if (key === "RD_TEAM_DRIVER_TOOLTIP") return "Swap Driver";
      return key;
    }),
  };

  const dummyParticipant: any = { objectId: "d1", name: "Driver 1" };
  const mockHd = new DriverHeatData("d1", dummyParticipant, 0);

  describe("isLaneColumnLapCountClickable", () => {
    it("should return false if parent, hd, or isUIEditorMode is set", () => {
      expect(
        isLaneColumnLapCountClickable(null, mockHd, "lapCount", false),
      ).toBeFalse();
      expect(
        isLaneColumnLapCountClickable({}, undefined, "lapCount", false),
      ).toBeFalse();
      expect(
        isLaneColumnLapCountClickable({}, mockHd, "lapCount", true),
      ).toBeFalse();
    });

    it("should delegate to parent.isLapCountColumnClickable when present", () => {
      const parent = {
        isLapCountColumnClickable: jasmine.createSpy().and.returnValue(true),
      };
      expect(
        isLaneColumnLapCountClickable(parent, mockHd, "customProp", false),
      ).toBeTrue();
      expect(parent.isLapCountColumnClickable).toHaveBeenCalledWith(mockHd, {
        propertyName: "customProp",
      });
    });

    it("should recognize default lap count columns", () => {
      const parent = {};
      expect(
        isLaneColumnLapCountClickable(parent, mockHd, "lapCount", false),
      ).toBeTrue();
      expect(
        isLaneColumnLapCountClickable(
          parent,
          mockHd,
          "physicalLapCount",
          false,
        ),
      ).toBeTrue();
      expect(
        isLaneColumnLapCountClickable(parent, mockHd, "totalTime", false),
      ).toBeTrue();
      expect(
        isLaneColumnLapCountClickable(
          parent,
          mockHd,
          "overallTotalTime",
          false,
        ),
      ).toBeTrue();
      expect(
        isLaneColumnLapCountClickable(parent, mockHd, "driver.name", false),
      ).toBeFalse();
    });
  });

  describe("isLaneColumnTeamDriverSwapActive", () => {
    it("should return false if parent or hd missing or in UI editor mode", () => {
      expect(
        isLaneColumnTeamDriverSwapActive(null, mockHd, "driver.name", false),
      ).toBeFalse();
      expect(
        isLaneColumnTeamDriverSwapActive({}, undefined, "driver.name", false),
      ).toBeFalse();
      expect(
        isLaneColumnTeamDriverSwapActive({}, mockHd, "driver.name", true),
      ).toBeFalse();
    });

    it("should delegate to parent.isTeamDriverSwapActive when present", () => {
      const parent = {
        isTeamDriverSwapActive: jasmine.createSpy().and.returnValue(true),
      };
      expect(
        isLaneColumnTeamDriverSwapActive(parent, mockHd, "driver.name", false),
      ).toBeTrue();
    });

    it("should return false for VIEWER role", () => {
      const parent = {
        isTeam: () => true,
        authService: { currentRole: Role.VIEWER },
      };
      expect(
        isLaneColumnTeamDriverSwapActive(parent, mockHd, "driver.name", false),
      ).toBeFalse();
    });

    it("should return true for team driver swap when conditions met", () => {
      const parent = {
        isTeam: () => true,
        authService: { currentRole: Role.ADMIN },
      };
      expect(
        isLaneColumnTeamDriverSwapActive(parent, mockHd, "driver.name", false),
      ).toBeTrue();
      expect(
        isLaneColumnTeamDriverSwapActive(
          parent,
          mockHd,
          "driver.nickname",
          false,
        ),
      ).toBeTrue();
      expect(
        isLaneColumnTeamDriverSwapActive(
          parent,
          mockHd,
          "participant.team.name_suffix",
          false,
        ),
      ).toBeTrue();
      expect(
        isLaneColumnTeamDriverSwapActive(parent, mockHd, "lapTime", false),
      ).toBeFalse();
    });

    it("should return false when isDriverSwapDisabled returns true", () => {
      const parent = {
        isTeam: () => true,
        isDriverSwapDisabled: () => true,
        authService: { currentRole: Role.ADMIN },
      };
      expect(
        isLaneColumnTeamDriverSwapActive(parent, mockHd, "driver.name", false),
      ).toBeFalse();
    });
  });

  describe("isLaneColumnPracticeLaneResetActive", () => {
    it("should return false if parent missing, in UI editor, not practice, or VIEWER", () => {
      expect(
        isLaneColumnPracticeLaneResetActive(null, "laneNumber", false),
      ).toBeFalse();
      expect(
        isLaneColumnPracticeLaneResetActive(
          { race: { practice: true } },
          "laneNumber",
          true,
        ),
      ).toBeFalse();
      expect(
        isLaneColumnPracticeLaneResetActive(
          { race: { practice: false } },
          "laneNumber",
          false,
        ),
      ).toBeFalse();
      expect(
        isLaneColumnPracticeLaneResetActive(
          {
            race: { practice: true },
            authService: { currentRole: Role.VIEWER },
          },
          "laneNumber",
          false,
        ),
      ).toBeFalse();
    });

    it("should return true for practice lane or name properties", () => {
      const parent = {
        race: { practice: true },
        authService: { currentRole: Role.ADMIN },
      };
      expect(
        isLaneColumnPracticeLaneResetActive(parent, "laneNumber", false),
      ).toBeTrue();
      expect(
        isLaneColumnPracticeLaneResetActive(parent, "driver.name", false),
      ).toBeTrue();
      expect(
        isLaneColumnPracticeLaneResetActive(parent, "lapTime", false),
      ).toBeFalse();
    });
  });

  describe("resolveLaneColumnCardTooltip", () => {
    it("should return null in UI editor mode or when neither active", () => {
      expect(
        resolveLaneColumnCardTooltip(
          mockTranslationService,
          true,
          true,
          {},
          true,
        ),
      ).toBeNull();
      expect(
        resolveLaneColumnCardTooltip(
          mockTranslationService,
          false,
          false,
          {},
          false,
        ),
      ).toBeNull();
    });

    it("should return lap tooltip when lap count is clickable", () => {
      expect(
        resolveLaneColumnCardTooltip(
          mockTranslationService,
          true,
          false,
          {},
          false,
        ),
      ).toBe("Edit Laps");
    });

    it("should return practice or team tooltip when driver swap is active", () => {
      expect(
        resolveLaneColumnCardTooltip(
          mockTranslationService,
          false,
          true,
          { race: { practice: true } },
          false,
        ),
      ).toBe("Practice Driver");
      expect(
        resolveLaneColumnCardTooltip(
          mockTranslationService,
          false,
          true,
          { race: { practice: false } },
          false,
        ),
      ).toBe("Swap Driver");
    });
  });

  describe("isLaneColumnInsetLapCount", () => {
    it("should return false in UI editor mode or if key is undefined", () => {
      expect(isLaneColumnInsetLapCount("lapCount", true)).toBeFalse();
      expect(isLaneColumnInsetLapCount(undefined, false)).toBeFalse();
    });

    it("should identify lap count keys", () => {
      expect(isLaneColumnInsetLapCount("lapCount", false)).toBeTrue();
      expect(isLaneColumnInsetLapCount("physicalLapCount", false)).toBeTrue();
      expect(isLaneColumnInsetLapCount("totalTime", false)).toBeTrue();
      expect(isLaneColumnInsetLapCount("overallTotalTime", false)).toBeTrue();
      expect(isLaneColumnInsetLapCount("driver.name", false)).toBeFalse();
    });
  });

  describe("formatLaneColumnInsetValue", () => {
    it("should return empty string if key is falsy", () => {
      expect(
        formatLaneColumnInsetValue(
          mockHd,
          "top-left",
          undefined,
          {} as any,
          {},
        ),
      ).toBe("");
    });

    it("should return '--' if hd is undefined", () => {
      expect(
        formatLaneColumnInsetValue(
          undefined,
          "top-left",
          "lapCount",
          {} as any,
          {},
        ),
      ).toBe("--");
    });

    it("should handle emptyRowsMode for undefined driver", () => {
      // blank mode returns empty string
      expect(
        formatLaneColumnInsetValue(
          undefined,
          "top-left",
          "lapCount",
          { emptyRowsMode: "blank" } as any,
          {},
        ),
      ).toBe("");

      // empty mode returns '--'
      expect(
        formatLaneColumnInsetValue(
          undefined,
          "top-left",
          "lapCount",
          { emptyRowsMode: "empty" } as any,
          {},
        ),
      ).toBe("--");
    });

    it("should delegate to parent.formatValue when available", () => {
      const parent = {
        columns: [{ propertyName: "lapCount" }],
        formatValue: jasmine.createSpy().and.returnValue("42 Laps"),
      };
      const result = formatLaneColumnInsetValue(
        mockHd,
        "top-left",
        "lapCount",
        {
          insetsConfig: {
            "top-left": {
              timeDecimalPlaces: 4,
              lapDecimalPlaces: 1,
              decimalPlaces: 2,
              timeDisplayFormat: "seconds",
              timeSubsecondMode: "always",
              timeSubsecondThreshold: 5,
              timeSubsecondDecimals: 3,
            },
          },
        } as any,
        parent,
      );
      expect(result).toBe("42 Laps");
      expect(parent.formatValue).toHaveBeenCalled();
    });

    it("should return team name in fallback when isOverallOrSeedDataSource is true and driver is a team", () => {
      const teamHd = {
        participant: { team: { name: "Apex Racers" } },
        driver: { name: "Alice", nickname: "Rocket" },
      } as any;
      const resName = formatLaneColumnInsetValue(
        teamHd,
        "top-left",
        "driver.name",
        { gridType: "overall" } as any,
        {},
      );
      expect(resName).toBe("Apex Racers");

      const resNick = formatLaneColumnInsetValue(
        teamHd,
        "top-left",
        "driver.nickname",
        { bindingMode: "seed" } as any,
        {},
      );
      expect(resNick).toBe("Apex Racers");
    });
  });

  describe("fitLaneColumnHeaderText", () => {
    it("should measure and scale font size appropriately", () => {
      const cardEl = document.createElement("div");
      Object.defineProperty(cardEl, "clientWidth", {
        value: 100,
        configurable: true,
      });
      Object.defineProperty(cardEl, "clientHeight", {
        value: 50,
        configurable: true,
      });
      const headerEl = document.createElement("div");
      headerEl.className = "lane-col-header";
      cardEl.appendChild(headerEl);

      fitLaneColumnHeaderText(
        cardEl,
        { headerFontSize: 24 } as any,
        null,
        "TEST HEADER",
      );
      expect(headerEl.style.fontSize).toMatch(/\d+px/);
    });

    it("should gracefully do nothing if header element missing", () => {
      const cardEl = document.createElement("div");
      expect(() =>
        fitLaneColumnHeaderText(cardEl, {} as any, null, "TEST"),
      ).not.toThrow();
    });
  });

  describe("resolveEffectiveHeaderFontSize", () => {
    it("should calculate auto size based on card height", () => {
      const cardEl = document.createElement("div");
      Object.defineProperty(cardEl, "clientHeight", {
        value: 100,
        configurable: true,
      });
      const size = resolveEffectiveHeaderFontSize(
        {} as any,
        { scaleMode: "auto" } as any,
        cardEl,
      );
      expect(size).toBe(18);
    });

    it("should return custom size if defined", () => {
      const size = resolveEffectiveHeaderFontSize(
        { headerFontSize: 20 } as any,
        null,
      );
      expect(size).toBe(20);
    });

    it("should fallback to 14 by default", () => {
      const size = resolveEffectiveHeaderFontSize({} as any, null);
      expect(size).toBe(14);
    });
  });

  describe("resolveEffectiveInsetFontSize", () => {
    it("should calculate auto size based on card height", () => {
      const cardEl = document.createElement("div");
      Object.defineProperty(cardEl, "clientHeight", {
        value: 100,
        configurable: true,
      });
      const size = resolveEffectiveInsetFontSize(
        {} as any,
        { scaleMode: "auto" } as any,
        cardEl,
      );
      expect(size).toBe(24);
    });

    it("should return custom size if defined", () => {
      const size = resolveEffectiveInsetFontSize(
        { insetFontSize: 22 } as any,
        null,
      );
      expect(size).toBe(22);
    });

    it("should fallback to 18 by default", () => {
      const size = resolveEffectiveInsetFontSize({} as any, null);
      expect(size).toBe(18);
    });
  });

  describe("setLaneColumnInset", () => {
    it("should update columnKey for center-center", () => {
      const node: any = { customSettings: {} };
      setLaneColumnInset(node, "center-center", "newKey");
      expect(node.customSettings.columnKey).toBe("newKey");
    });

    it("should set inset for specific anchor", () => {
      const node: any = {};
      setLaneColumnInset(node, "top-left", "customProp");
      expect(node.customSettings.insets["top-left"]).toBe("customProp");
    });
  });

  describe("deleteLaneColumnAnchor", () => {
    it("should delete inset and insetsConfig for anchor", () => {
      const node: any = {
        id: "w1",
        customSettings: {
          insets: { "top-left": "val" },
          insetsConfig: { "top-left": { fontSize: 12 } },
        },
      };
      const parent = { selectAnchor: jasmine.createSpy("selectAnchor") };
      const emitter = { emit: jasmine.createSpy("emit") };

      deleteLaneColumnAnchor(node, "top-left", parent, "top-left", emitter);
      expect(node.customSettings.insets["top-left"]).toBeUndefined();
      expect(node.customSettings.insetsConfig["top-left"]).toBeUndefined();
      expect(parent.selectAnchor).toHaveBeenCalledWith("w1", null);
      expect(emitter.emit).toHaveBeenCalledWith({
        widgetId: "w1",
        anchor: null,
      });
    });
  });

  describe("notifyLaneColumnParentChange", () => {
    it("should trigger parent emitters and change detection", () => {
      const parent = {
        gridSession: () => true,
        onMasterWidgetModified: jasmine.createSpy(),
        layout: {},
        layoutChanged: { emit: jasmine.createSpy() },
        markLayoutDirty: jasmine.createSpy(),
        columnsChanged: { emit: jasmine.createSpy() },
        onWidgetSettingsChanged: jasmine.createSpy(),
        cdr: { markForCheck: jasmine.createSpy() },
      };
      const node: any = { id: "w1" };

      notifyLaneColumnParentChange(parent, node);
      expect(parent.onMasterWidgetModified).toHaveBeenCalledWith(node);
      expect(parent.layoutChanged.emit).toHaveBeenCalledWith(parent.layout);
      expect(parent.markLayoutDirty).toHaveBeenCalled();
      expect(parent.columnsChanged.emit).toHaveBeenCalled();
      expect(parent.onWidgetSettingsChanged).toHaveBeenCalledWith(node);
      expect(parent.cdr.markForCheck).toHaveBeenCalled();
    });

    it("should not call onMasterWidgetModified when widget is null", () => {
      const parent = {
        gridSession: () => ({ gridId: "grid-1" }),
        onMasterWidgetModified: jasmine.createSpy(),
      };
      notifyLaneColumnParentChange(parent, null);
      expect(parent.onMasterWidgetModified).not.toHaveBeenCalled();
    });

    it("should not call onMasterWidgetModified when widget gridId does not match session gridId", () => {
      const parent = {
        gridSession: () => ({ gridId: "grid-1" }),
        onMasterWidgetModified: jasmine.createSpy(),
      };
      const node: any = {
        id: "w1",
        customSettings: { gridId: "other-grid" },
      };
      notifyLaneColumnParentChange(parent, node);
      expect(parent.onMasterWidgetModified).not.toHaveBeenCalled();
    });

    it("should resolve master widget and transfer insets when modifying a mirrored child widget", () => {
      const masterNode: any = {
        id: "w-master",
        customSettings: { gridId: "grid-1", gridLane: 0 },
      };
      const childNode: any = {
        id: "w-master_grid_lane_1",
        customSettings: {
          gridId: "grid-1",
          gridMasterId: "w-master",
          gridLane: 1,
          insets: { "bottom-right": "qrCode" },
          insetsConfig: { "bottom-right": { timeDecimalPlaces: 2 } },
          columnKey: "driver.name",
        },
      };
      const parent = {
        gridSession: () => ({
          gridId: "grid-1",
          sourceLaneIndex: 0,
          mirrorRows: true,
        }),
        onMasterWidgetModified: jasmine.createSpy(),
        layout: { widgets: [masterNode, childNode] },
      };

      notifyLaneColumnParentChange(parent, childNode);
      expect(parent.onMasterWidgetModified).toHaveBeenCalledWith(masterNode);
      expect(masterNode.customSettings["insets"]).toEqual({
        "bottom-right": "qrCode",
      });
      expect(masterNode.customSettings["insetsConfig"]).toEqual({
        "bottom-right": { timeDecimalPlaces: 2 },
      });
      expect(masterNode.customSettings["columnKey"]).toBe("driver.name");
    });
  });

  describe("resolveLaneColumnBackgroundColor and resolveLaneColumnForegroundColor", () => {
    it("should respect useLaneColors: false", () => {
      const settings = {
        useLaneColors: false,
        backgroundColor: "#customBg",
        textColor: "#customFg",
      };
      expect(
        resolveLaneColumnBackgroundColor(
          settings as any,
          mockHd,
          {},
          "lane",
          0,
        ),
      ).toBe("#customBg");
      expect(
        resolveLaneColumnForegroundColor(
          settings as any,
          mockHd,
          {},
          "lane",
          0,
        ),
      ).toBe("#customFg");
    });

    it("should retrieve track lane color when parent provides track", () => {
      const parent = {
        track: {
          lanes: [
            { background_color: "#lane0Bg", foreground_color: "#lane0Fg" },
          ],
        },
      };
      expect(
        resolveLaneColumnBackgroundColor({} as any, mockHd, parent, "lane", 0),
      ).toBe("#lane0Bg");
      expect(
        resolveLaneColumnForegroundColor({} as any, mockHd, parent, "lane", 0),
      ).toBe("#lane0Fg");
    });

    it("should not apply lane 0 color to empty row or undefined driver in position mode", () => {
      const parent = {
        track: {
          lanes: [
            { background_color: "#lane0Bg", foreground_color: "#lane0Fg" },
          ],
        },
      };
      const settings = {
        useLaneColors: true,
        backgroundColor: "#defaultBg",
        textColor: "#defaultFg",
      };

      expect(
        resolveLaneColumnBackgroundColor(
          settings as any,
          undefined,
          parent,
          "position",
          5,
        ),
      ).toBe("#defaultBg");
      expect(
        resolveLaneColumnForegroundColor(
          settings as any,
          undefined,
          parent,
          "position",
          5,
        ),
      ).toBe("#defaultFg");

      // Without explicit settings fallback, defaults to transparent and white
      expect(
        resolveLaneColumnBackgroundColor(
          {} as any,
          undefined,
          parent,
          "position",
          5,
        ),
      ).toBe("transparent");
      expect(
        resolveLaneColumnForegroundColor(
          {} as any,
          undefined,
          parent,
          "position",
          5,
        ),
      ).toBe("#ffffff");
    });

    it("should not apply lane 0 color to empty driver in position mode", () => {
      const parent = {
        track: {
          lanes: [
            { background_color: "#lane0Bg", foreground_color: "#lane0Fg" },
          ],
        },
      };
      const emptyHd: any = { isEmpty: true, laneIndex: 0 };

      expect(
        resolveLaneColumnBackgroundColor(
          {} as any,
          emptyHd,
          parent,
          "position",
          4,
        ),
      ).toBe("transparent");
      expect(
        resolveLaneColumnForegroundColor(
          {} as any,
          emptyHd,
          parent,
          "position",
          4,
        ),
      ).toBe("#ffffff");
    });

    it("should not apply lane 0 color to non-heat driver with laneIndex -1 in position mode", () => {
      const parent = {
        track: {
          lanes: [
            { background_color: "#lane0Bg", foreground_color: "#lane0Fg" },
          ],
        },
      };
      const nonHeatHd = new DriverHeatData(
        "d2",
        { objectId: "d2", name: "Driver 2" } as any,
        -1,
      );

      expect(
        resolveLaneColumnBackgroundColor(
          {} as any,
          nonHeatHd,
          parent,
          "overallPosition",
          3,
        ),
      ).toBe("transparent");
      expect(
        resolveLaneColumnForegroundColor(
          {} as any,
          nonHeatHd,
          parent,
          "overallPosition",
          3,
        ),
      ).toBe("#ffffff");
    });

    it("should still retrieve lane color in lane mode when driver is undefined", () => {
      const parent = {
        track: {
          lanes: [
            { background_color: "#lane0Bg", foreground_color: "#lane0Fg" },
          ],
        },
      };
      expect(
        resolveLaneColumnBackgroundColor(
          {} as any,
          undefined,
          parent,
          "lane",
          0,
        ),
      ).toBe("#lane0Bg");
      expect(
        resolveLaneColumnForegroundColor(
          {} as any,
          undefined,
          parent,
          "lane",
          0,
        ),
      ).toBe("#lane0Fg");
    });

    it("should consider all positions not in a lane and style like non-lane rows when race is over with overall data source", () => {
      const parent = {
        raceState: RaceState.RACE_OVER,
        track: {
          lanes: [
            { background_color: "#lane0Bg", foreground_color: "#lane0Fg" },
          ],
        },
      };
      const activeHd = new DriverHeatData(
        "d1",
        { objectId: "d1", name: "Driver 1" } as any,
        0,
      );
      const settings = {
        useLaneColors: true,
        gridType: "overall",
        backgroundColor: "#defaultBg",
        textColor: "#defaultFg",
      };

      // Even though hd has laneIndex: 0, it should be considered not in a lane and use fallback colors
      expect(
        resolveLaneColumnBackgroundColor(
          settings as any,
          activeHd,
          parent,
          "position",
          0,
        ),
      ).toBe("#defaultBg");
      expect(
        resolveLaneColumnForegroundColor(
          settings as any,
          activeHd,
          parent,
          "position",
          0,
        ),
      ).toBe("#defaultFg");

      // Without explicit settings colors, defaults to transparent and #ffffff
      expect(
        resolveLaneColumnBackgroundColor(
          { useLaneColors: true, gridType: "overall" } as any,
          activeHd,
          parent,
          "overallPosition",
          0,
        ),
      ).toBe("transparent");
      expect(
        resolveLaneColumnForegroundColor(
          { useLaneColors: true, gridType: "overall" } as any,
          activeHd,
          parent,
          "overallPosition",
          0,
        ),
      ).toBe("#ffffff");
    });

    it("should keep lane color when race is NOT over with overall data source", () => {
      const parent = {
        raceState: RaceState.RACING,
        track: {
          lanes: [
            { background_color: "#lane0Bg", foreground_color: "#lane0Fg" },
          ],
        },
      };
      const activeHd = new DriverHeatData(
        "d1",
        {
          objectId: "d1",
          name: "Driver 1",
          driver: { entity_id: "d1", name: "Driver 1" },
        } as any,
        0,
        { entity_id: "d1", name: "Driver 1" } as any,
      );
      const settings = {
        useLaneColors: true,
        gridType: "overall",
        backgroundColor: "#defaultBg",
        textColor: "#defaultFg",
      };

      expect(
        resolveLaneColumnBackgroundColor(
          settings as any,
          activeHd,
          parent,
          "position",
          0,
        ),
      ).toBe("#lane0Bg");
      expect(
        resolveLaneColumnForegroundColor(
          settings as any,
          activeHd,
          parent,
          "position",
          0,
        ),
      ).toBe("#lane0Fg");
    });

    it("should keep lane color when race is over with heat data source", () => {
      const parent = {
        raceState: RaceState.RACE_OVER,
        track: {
          lanes: [
            { background_color: "#lane0Bg", foreground_color: "#lane0Fg" },
          ],
        },
      };
      const activeHd = new DriverHeatData(
        "d1",
        {
          objectId: "d1",
          name: "Driver 1",
          driver: { entity_id: "d1", name: "Driver 1" },
        } as any,
        0,
        { entity_id: "d1", name: "Driver 1" } as any,
      );
      const heatSettings = {
        useLaneColors: true,
        gridType: "heat",
        gridId: "grid-heat-1",
        bindingMode: "overallPosition",
        backgroundColor: "#defaultBg",
        textColor: "#defaultFg",
      };

      expect(
        resolveLaneColumnBackgroundColor(
          heatSettings as any,
          activeHd,
          parent,
          "overallPosition",
          0,
        ),
      ).toBe("#lane0Bg");
      expect(
        resolveLaneColumnForegroundColor(
          heatSettings as any,
          activeHd,
          parent,
          "overallPosition",
          0,
        ),
      ).toBe("#lane0Fg");
    });

    it("should apply lane colors to empty driver on heat grid in position mode", () => {
      const parent = {
        track: {
          lanes: [
            { background_color: "#lane0Bg", foreground_color: "#lane0Fg" },
            { background_color: "#lane1Bg", foreground_color: "#lane1Fg" },
            { background_color: "#lane2Bg", foreground_color: "#lane2Fg" },
            { background_color: "#lane3Bg", foreground_color: "#lane3Fg" },
          ],
        },
      };
      const emptyHd: any = { isEmpty: true, laneIndex: 3 };
      const heatSettings = {
        useLaneColors: true,
        gridType: "heat",
      };

      expect(
        resolveLaneColumnBackgroundColor(
          heatSettings as any,
          emptyHd,
          parent,
          "position",
          3,
        ),
      ).toBe("#lane3Bg");
      expect(
        resolveLaneColumnForegroundColor(
          heatSettings as any,
          emptyHd,
          parent,
          "position",
          3,
        ),
      ).toBe("#lane3Fg");
    });

    it("should apply lane colors via parent.getLaneColor for empty driver on heat grid", () => {
      const parent = {
        track: {
          lanes: [
            { background_color: "#lane0Bg", foreground_color: "#lane0Fg" },
            { background_color: "#lane1Bg", foreground_color: "#lane1Fg" },
            { background_color: "#lane2Bg", foreground_color: "#lane2Fg" },
            { background_color: "#lane3Bg", foreground_color: "#lane3Fg" },
          ],
        },
        getLaneColor: (hd: any, prop: string) => {
          if (hd.laneIndex === 2) {
            return prop === "background_color"
              ? "#customLane2Bg"
              : "#customLane2Fg";
          }
          return "";
        },
      };
      const emptyHd: any = { isEmpty: true, laneIndex: 2 };
      const heatSettings = {
        useLaneColors: true,
        gridType: "heat",
      };

      expect(
        resolveLaneColumnBackgroundColor(
          heatSettings as any,
          emptyHd,
          parent,
          "position",
          2,
        ),
      ).toBe("#customLane2Bg");
      expect(
        resolveLaneColumnForegroundColor(
          heatSettings as any,
          emptyHd,
          parent,
          "position",
          2,
        ),
      ).toBe("#customLane2Fg");
    });

    it("should resolve unoccupied lane color when driver is undefined in position mode within track lanes", () => {
      const createActiveDriver = (id: string, lane: number) =>
        new DriverHeatData(
          id,
          {
            objectId: id,
            name: id,
            driver: { entity_id: id, name: id },
          } as any,
          lane,
          { entity_id: id, name: id } as any,
        );
      const active0 = createActiveDriver("d0", 0);
      const active1 = createActiveDriver("d1", 1);
      const active2 = createActiveDriver("d2", 2);
      const parent = {
        track: {
          lanes: [
            { background_color: "#lane0Bg", foreground_color: "#lane0Fg" },
            { background_color: "#lane1Bg", foreground_color: "#lane1Fg" },
            { background_color: "#lane2Bg", foreground_color: "#lane2Fg" },
            { background_color: "#lane3Bg", foreground_color: "#lane3Fg" },
          ],
        },
        heatDrivers: [active0, active1, active2],
      };
      const heatSettings = {
        useLaneColors: true,
        gridType: "heat",
      };

      // TargetIndex 3 represents the 4th position row (the unoccupied lane 3)
      expect(
        resolveLaneColumnBackgroundColor(
          heatSettings as any,
          undefined,
          parent,
          "position",
          3,
        ),
      ).toBe("#lane3Bg");
      expect(
        resolveLaneColumnForegroundColor(
          heatSettings as any,
          undefined,
          parent,
          "position",
          3,
        ),
      ).toBe("#lane3Fg");
    });

    it("should resolve unoccupied lane colors in order when multiple lanes are empty in position mode", () => {
      const createActiveDriver = (id: string, lane: number) =>
        new DriverHeatData(
          id,
          {
            objectId: id,
            name: id,
            driver: { entity_id: id, name: id },
          } as any,
          lane,
          { entity_id: id, name: id } as any,
        );
      const active1 = createActiveDriver("d1", 1);
      const active3 = createActiveDriver("d3", 3);
      const parent = {
        track: {
          lanes: [
            { background_color: "#lane0Bg", foreground_color: "#lane0Fg" },
            { background_color: "#lane1Bg", foreground_color: "#lane1Fg" },
            { background_color: "#lane2Bg", foreground_color: "#lane2Fg" },
            { background_color: "#lane3Bg", foreground_color: "#lane3Fg" },
          ],
        },
        heatDrivers: [active1, active3],
      };
      const heatSettings = {
        useLaneColors: true,
        gridType: "heat",
      };

      // 2 active drivers occupy lanes 1 & 3; unoccupied lanes are 0 & 2
      // targetIndex 2 is the 1st unoccupied lane (Lane 0)
      expect(
        resolveLaneColumnBackgroundColor(
          heatSettings as any,
          undefined,
          parent,
          "position",
          2,
        ),
      ).toBe("#lane0Bg");
      expect(
        resolveLaneColumnForegroundColor(
          heatSettings as any,
          undefined,
          parent,
          "position",
          2,
        ),
      ).toBe("#lane0Fg");

      // targetIndex 3 is the 2nd unoccupied lane (Lane 2)
      expect(
        resolveLaneColumnBackgroundColor(
          heatSettings as any,
          undefined,
          parent,
          "position",
          3,
        ),
      ).toBe("#lane2Bg");
      expect(
        resolveLaneColumnForegroundColor(
          heatSettings as any,
          undefined,
          parent,
          "position",
          3,
        ),
      ).toBe("#lane2Fg");
    });

    it("should not apply lane color to empty row beyond physical track lanes in position mode", () => {
      const parent = {
        track: {
          lanes: [
            { background_color: "#lane0Bg", foreground_color: "#lane0Fg" },
            { background_color: "#lane1Bg", foreground_color: "#lane1Fg" },
          ],
        },
      };
      const emptyHd: any = { isEmpty: true, laneIndex: 0 };
      const heatSettings = {
        useLaneColors: true,
        gridType: "heat",
      };

      // targetIndex 2 and 3 are beyond the 2 physical lanes
      expect(
        resolveLaneColumnBackgroundColor(
          heatSettings as any,
          emptyHd,
          parent,
          "position",
          2,
        ),
      ).toBe("transparent");
      expect(
        resolveLaneColumnForegroundColor(
          heatSettings as any,
          emptyHd,
          parent,
          "position",
          2,
        ),
      ).toBe("#ffffff");

      expect(
        resolveLaneColumnBackgroundColor(
          heatSettings as any,
          undefined,
          parent,
          "position",
          3,
        ),
      ).toBe("transparent");
      expect(
        resolveLaneColumnForegroundColor(
          heatSettings as any,
          undefined,
          parent,
          "position",
          3,
        ),
      ).toBe("#ffffff");
    });

    it("should not apply lane color to empty driver on overall grid in position mode", () => {
      const parent = {
        track: {
          lanes: [
            { background_color: "#lane0Bg", foreground_color: "#lane0Fg" },
            { background_color: "#lane1Bg", foreground_color: "#lane1Fg" },
          ],
        },
      };
      const emptyHd: any = { isEmpty: true, laneIndex: 0 };
      const overallSettings = {
        useLaneColors: true,
        gridType: "overall",
      };

      expect(
        resolveLaneColumnBackgroundColor(
          overallSettings as any,
          emptyHd,
          parent,
          "position",
          0,
        ),
      ).toBe("transparent");
      expect(
        resolveLaneColumnForegroundColor(
          overallSettings as any,
          emptyHd,
          parent,
          "position",
          0,
        ),
      ).toBe("#ffffff");
    });
  });

  describe("resolveHeatEmptyLaneIndex", () => {
    it("should return -1 when track or lanes are missing or targetIndex is invalid", () => {
      expect(resolveHeatEmptyLaneIndex(undefined, 0)).toBe(-1);
      expect(resolveHeatEmptyLaneIndex({}, 0)).toBe(-1);
      expect(resolveHeatEmptyLaneIndex({}, -1, { lanes: [{}] })).toBe(-1);
      expect(
        resolveHeatEmptyLaneIndex({}, 4, { lanes: [{}, {}, {}, {}] }),
      ).toBe(-1);
    });

    it("should return empty lanes in order when some lanes are unoccupied", () => {
      const track = { lanes: [{}, {}, {}, {}] };
      const active0 = new DriverHeatData(
        "d0",
        {
          objectId: "d0",
          name: "D0",
          driver: { entity_id: "d0", name: "D0" },
        } as any,
        0,
        { entity_id: "d0", name: "D0" } as any,
      );
      const active2 = new DriverHeatData(
        "d2",
        {
          objectId: "d2",
          name: "D2",
          driver: { entity_id: "d2", name: "D2" },
        } as any,
        2,
        { entity_id: "d2", name: "D2" } as any,
      );
      const parent = { heatDrivers: [active0, active2] };

      // Active count is 2 (lanes 0 and 2). Unoccupied lanes are 1 and 3.
      expect(resolveHeatEmptyLaneIndex(parent, 2, track)).toBe(1);
      expect(resolveHeatEmptyLaneIndex(parent, 3, track)).toBe(3);
    });

    it("should handle all lanes unoccupied when heatDrivers is empty", () => {
      const track = { lanes: [{}, {}, {}] };
      const parent = { heatDrivers: [] };

      expect(resolveHeatEmptyLaneIndex(parent, 0, track)).toBe(0);
      expect(resolveHeatEmptyLaneIndex(parent, 1, track)).toBe(1);
      expect(resolveHeatEmptyLaneIndex(parent, 2, track)).toBe(2);
      expect(resolveHeatEmptyLaneIndex(parent, 3, track)).toBe(-1);
    });
  });

  describe("handleLaneColumnCardClick", () => {
    it("should do nothing if isUIEditorMode is true or parent/hd is missing", () => {
      const parent = { onCellClick: jasmine.createSpy("onCellClick") };
      const event: any = {
        stopPropagation: jasmine.createSpy("stopPropagation"),
      };
      handleLaneColumnCardClick(
        event,
        parent,
        mockHd,
        "lapCount",
        true,
        true,
        false,
      );
      expect(parent.onCellClick).not.toHaveBeenCalled();

      handleLaneColumnCardClick(
        event,
        null,
        mockHd,
        "lapCount",
        false,
        true,
        false,
      );
      expect(parent.onCellClick).not.toHaveBeenCalled();

      handleLaneColumnCardClick(
        event,
        parent,
        undefined,
        "lapCount",
        false,
        true,
        false,
      );
      expect(parent.onCellClick).not.toHaveBeenCalled();
    });

    it("should call parent.onCellClick when isLapCountClickable is true", () => {
      const parent = { onCellClick: jasmine.createSpy("onCellClick") };
      const event: any = {
        stopPropagation: jasmine.createSpy("stopPropagation"),
      };
      handleLaneColumnCardClick(
        event,
        parent,
        mockHd,
        "lapCount",
        false,
        true,
        false,
      );
      expect(parent.onCellClick).toHaveBeenCalledWith(
        mockHd,
        { propertyName: "lapCount" } as any,
        event,
      );
    });

    it("should open teammate select if isTeamDriverSwapActive is true", () => {
      const select = { toggleOpen: jasmine.createSpy("toggleOpen") };
      const event: any = {
        target: document.createElement("div"),
        stopPropagation: jasmine.createSpy("stopPropagation"),
      };
      handleLaneColumnCardClick(
        event,
        {},
        mockHd,
        "driver.name",
        false,
        false,
        true,
        select,
      );
      expect(select.toggleOpen).toHaveBeenCalled();
      expect(event.stopPropagation).toHaveBeenCalled();
    });

    it("should not open teammate select if click was inside custom-select", () => {
      const select = { toggleOpen: jasmine.createSpy("toggleOpen") };
      const selectEl = document.createElement("app-custom-select");
      const target = document.createElement("span");
      selectEl.appendChild(target);
      const event: any = {
        target,
        stopPropagation: jasmine.createSpy("stopPropagation"),
      };
      handleLaneColumnCardClick(
        event,
        {},
        mockHd,
        "driver.name",
        false,
        false,
        true,
        select,
      );
      expect(select.toggleOpen).not.toHaveBeenCalled();
    });
  });

  describe("handleLaneColumnInsetClick", () => {
    it("should do nothing if isUIEditorMode is true", () => {
      const parent = { onCellClick: jasmine.createSpy("onCellClick") };
      const event: any = {
        stopPropagation: jasmine.createSpy("stopPropagation"),
      };
      handleLaneColumnInsetClick(
        event,
        "top-left",
        { "top-left": "lapCount" },
        parent,
        mockHd,
        true,
      );
      expect(parent.onCellClick).not.toHaveBeenCalled();
    });

    it("should invoke parent.onCellClick for lapCount inset", () => {
      const parent = { onCellClick: jasmine.createSpy("onCellClick") };
      const event: any = {
        stopPropagation: jasmine.createSpy("stopPropagation"),
      };
      handleLaneColumnInsetClick(
        event,
        "top-left",
        { "top-left": "lapCount" },
        parent,
        mockHd,
        false,
      );
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(parent.onCellClick).toHaveBeenCalledWith(
        mockHd,
        { propertyName: "lapCount" } as any,
        event,
      );
    });
  });

  describe("resolveLaneColumnFormattedValue", () => {
    it("should return -- when hd is undefined", () => {
      expect(
        resolveLaneColumnFormattedValue(
          undefined,
          "lapCount",
          {},
          {} as any,
          "lane",
        ),
      ).toBe("--");
    });

    it("should handle emptyRowsMode for undefined driver", () => {
      // blank mode returns empty string
      expect(
        resolveLaneColumnFormattedValue(
          undefined,
          "lapCount",
          {},
          { emptyRowsMode: "blank" } as any,
          "lane",
        ),
      ).toBe("");

      // empty mode returns '--' for lapCount
      expect(
        resolveLaneColumnFormattedValue(
          undefined,
          "lapCount",
          {},
          { emptyRowsMode: "empty" } as any,
          "lane",
        ),
      ).toBe("--");

      // empty mode returns 'RD_EMPTY_LANE' for driver.name on heat/lane grid
      expect(
        resolveLaneColumnFormattedValue(
          undefined,
          "driver.name",
          {},
          { emptyRowsMode: "empty" } as any,
          "lane",
        ),
      ).toBe("RD_EMPTY_LANE");

      // empty mode returns '--' for driver.name on overall grid
      expect(
        resolveLaneColumnFormattedValue(
          undefined,
          "driver.name",
          {},
          { gridType: "overall", emptyRowsMode: "empty" } as any,
          "overallPosition",
        ),
      ).toBe("--");

      // isNameOrNicknameProperty helper
      expect(isNameOrNicknameProperty("driver.name")).toBeTrue();
      expect(isNameOrNicknameProperty("driver.nickname")).toBeTrue();
      expect(isNameOrNicknameProperty("name")).toBeTrue();
      expect(isNameOrNicknameProperty("nickname")).toBeTrue();
      expect(isNameOrNicknameProperty("lapCount")).toBeFalse();
    });

    it("should delegate to parent.formatValue if provided", () => {
      const parent = {
        formatValue: jasmine
          .createSpy("formatValue")
          .and.returnValue("Formatted 42"),
      };
      const result = resolveLaneColumnFormattedValue(
        mockHd,
        "lapCount",
        parent,
        {} as any,
        "lane",
      );
      expect(result).toBe("Formatted 42");
    });

    it("should resolve team name on overall/seed standings for team drivers", () => {
      const teamHd: any = {
        driver: { entity_id: "d1", name: "Driver 1" },
        participant: { team: { name: "Team Fast" } },
      };
      const parent = {
        gridSession: () => ({ dataSource: "overallStandings" }),
      };
      const result = resolveLaneColumnFormattedValue(
        teamHd,
        "driver.name",
        parent,
        {} as any,
        "overallPosition",
      );
      expect(result).toBe("Team Fast");
    });
  });

  describe("applyLaneColumnLastLapsFit", () => {
    it("should handle null cardEl gracefully", () => {
      const onFit = jasmine.createSpy("onFit");
      expect(() =>
        applyLaneColumnLastLapsFit(null, {} as any, null, 5, true, onFit),
      ).not.toThrow();
      expect(onFit).not.toHaveBeenCalled();
    });

    it("should apply custom scaling font size and lap count", () => {
      const el = document.createElement("div");
      const onFit = jasmine.createSpy("onFit");
      const widget: any = { scaleMode: "fixed", fontSize: 24 };
      applyLaneColumnLastLapsFit(
        el,
        { valueFontSize: 24 } as any,
        widget,
        8,
        true,
        onFit,
      );
      expect(onFit).toHaveBeenCalledWith(8);
      expect(el.style.getPropertyValue("--lane-col-last-laps-font-size")).toBe(
        "24px",
      );
    });
  });
});
