import {
  allFields,
  InspectorField,
  isFieldChanged,
  isFieldVisible,
  registryDefaults,
  resetField,
} from "@app/components/ui-editor/inspector-kit/inspector-schema";

import { BATCH2_SCHEMAS } from "./batch2-schemas";

const field = (type: string, id: string): InspectorField =>
  allFields(BATCH2_SCHEMAS[type]).find((f) => f.id === id)!;

const ctx = (totalLanes: number) => ({ widget: null, totalLanes });

describe("batch 2 schemas", () => {
  describe("Heat List display", () => {
    const active = () => field("heat-list", "activeHeatDisplay");
    const future = () => field("heat-list", "futureHeatsDisplay");

    it("keeps cards as the default and shows the relevant options for each layout", () => {
      const table = { heatListLayout: "table" };
      const status = field("heat-list", "heatTableShowStatus");
      const colors = field("heat-list", "heatTableShowLaneColors");
      expect(registryDefaults("heat-list")["heatListLayout"]).toBe("cards");
      expect(isFieldVisible(status, {})).toBeFalse();
      expect(isFieldVisible(active(), {})).toBeTrue();
      expect(isFieldVisible(status, table)).toBeTrue();
      expect(isFieldVisible(active(), table)).toBeFalse();
      expect(
        isFieldVisible(field("heat-list", "summaryShowDriver"), table),
      ).toBeFalse();
      expect(isFieldVisible(colors, table)).toBeTrue();
      expect(
        isFieldVisible(colors, { ...table, heatTableShowLanes: false }),
      ).toBeFalse();
    });

    it("offers expandable details only for tables and keeps lane styles available for details", () => {
      const details = field("heat-list", "heatTableShowDetails");
      const colors = field("heat-list", "heatTableShowLaneColors");
      const table = { heatListLayout: "table", heatTableShowLanes: false };
      expect(registryDefaults("heat-list")["heatTableShowDetails"]).toBeFalse();
      expect(isFieldVisible(details, {})).toBeFalse();
      expect(isFieldVisible(details, table)).toBeTrue();
      expect(isFieldVisible(colors, table)).toBeFalse();
      expect(
        isFieldVisible(colors, { ...table, heatTableShowDetails: true }),
      ).toBeTrue();
    });

    it("reads older layouts from the summary flags like the old inspector", () => {
      expect(active().read!({})).toBe("summary_lane_colors");
      expect(active().read!({ showActiveSummary: false })).toBe("lane_colors");
      expect(
        active().read!({
          showActiveSummary: true,
          summaryUseLaneColors: false,
        }),
      ).toBe("summary");
      // future heats only show a summary when switched on
      expect(future().read!({})).toBe("lane_colors");
      expect(future().read!({ showFutureSummary: true })).toBe(
        "summary_lane_colors",
      );
    });

    it("a stored choice wins over the flags", () => {
      expect(
        active().read!({ activeHeatDisplay: "off", showActiveSummary: true }),
      ).toBe("off");
    });

    it("a choice also sets the summary flag", () => {
      const s: Record<string, any> = {};
      active().write!(s, "summary", ctx(4));
      expect(s).toEqual({
        activeHeatDisplay: "summary",
        showActiveSummary: true,
      });
      active().write!(s, "lane_colors", ctx(4));
      expect(s["showActiveSummary"]).toBe(false);
    });

    it("is changed only when what it shows differs from the default", () => {
      const defaults = registryDefaults("heat-list");
      expect(isFieldChanged(active(), {}, defaults)).toBeFalse();
      expect(
        isFieldChanged(
          active(),
          { activeHeatDisplay: "summary_lane_colors" },
          defaults,
        ),
      ).toBeFalse();
      expect(
        isFieldChanged(active(), { showActiveSummary: false }, defaults),
      ).toBeTrue();
    });

    it("reset puts back both keys", () => {
      const defaults = registryDefaults("heat-list");
      const s: Record<string, any> = {
        activeHeatDisplay: "off",
        showActiveSummary: false,
      };
      resetField(active(), s, defaults);
      expect(s["activeHeatDisplay"]).toBe(defaults["activeHeatDisplay"]);
      expect(s["showActiveSummary"]).toBe(defaults["showActiveSummary"]);
    });
  });

  describe("Progress Gauge target lane", () => {
    const target = () => field("progress-gauge", "targetIndex");
    const binding = () => field("progress-gauge", "bindingMode");

    it("shows the 0-based index as lane 1, 2, 3", () => {
      expect(target().read!({})).toBe(1);
      expect(target().read!({ targetIndex: 2 })).toBe(3);
    });

    it("stores lane - 1 and keeps it on the track", () => {
      const s: Record<string, any> = {};
      target().write!(s, 3, ctx(4));
      expect(s["targetIndex"]).toBe(2);
      target().write!(s, 9, ctx(4));
      expect(s["targetIndex"]).toBe(3);
      target().write!(s, 0, ctx(4));
      expect(s["targetIndex"]).toBe(0);
    });

    it("its maximum is the number of lanes", () => {
      const f = target();
      expect(f.type === "stepper" && f.maxFrom!(ctx(6))).toBe(6);
    });

    it("switching to a fixed lane pulls a target beyond the track back", () => {
      const s: Record<string, any> = {
        bindingMode: "hostLane",
        targetIndex: 7,
      };
      binding().write!(s, "lane", ctx(4));
      expect(s).toEqual({ bindingMode: "lane", targetIndex: 3 });
    });
  });

  it("only the group leaderboard has a subtitle", () => {
    const ids = (t: string) => allFields(BATCH2_SCHEMAS[t]).map((f) => f.id);
    expect(ids("group-leaderboard")).toContain("subtitle");
    expect(ids("leaderboard")).not.toContain("subtitle");
  });

  it("only Next Heat has the alternating row contrast", () => {
    const ids = (t: string) => allFields(BATCH2_SCHEMAS[t]).map((f) => f.id);
    expect(ids("next-heat")).toContain("alternatingRowContrast");
    expect(ids("on-deck")).not.toContain("alternatingRowContrast");
  });
});
