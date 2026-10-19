import { Role } from "@app/models/role";
import { DriverHeatData } from "@app/race/driver_heat_data";

import {
  deleteLaneColumnAnchor,
  fitLaneColumnHeaderText,
  formatLaneColumnInsetValue,
  isLaneColumnInsetLapCount,
  isLaneColumnLapCountClickable,
  isLaneColumnPracticeLaneResetActive,
  isLaneColumnTeamDriverSwapActive,
  notifyLaneColumnParentChange,
  resolveEffectiveHeaderFontSize,
  resolveEffectiveInsetFontSize,
  resolveLaneColumnBackgroundColor,
  resolveLaneColumnCardTooltip,
  resolveLaneColumnForegroundColor,
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
  });
});
