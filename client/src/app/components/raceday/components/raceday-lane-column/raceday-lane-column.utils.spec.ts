import {
  buildSyntheticInsetWidgetInputs,
  buildSyntheticMainWidgetInputs,
  formatAdjustedLapValue,
  getInsetDefaultAlignment,
  isCustomWidgetKey,
  resolveColumnHeaderLabel,
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
});
