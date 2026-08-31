import { WIDGET_REGISTRY } from "./widget-registry";

describe("WIDGET_REGISTRY", () => {
  it("should have registry entries for all known widgets", () => {
    const keys = Object.keys(WIDGET_REGISTRY);
    expect(keys.length).toBeGreaterThan(15);
    expect(keys).toContain("leaderboard");
    expect(keys).toContain("records");
    expect(keys).toContain("timer");
    expect(keys).toContain("image");
    expect(keys).toContain("lane-view");
    expect(keys).toContain("on-deck");
    expect(keys).toContain("next-heat");
    expect(keys).toContain("group-leaderboard");
    expect(keys).toContain("heat-info");
    expect(keys).toContain("race-name");
    expect(keys).toContain("event-name");
    expect(keys).toContain("season-name");
    expect(keys).toContain("season-leaderboard");
    expect(keys).toContain("season-race-leaderboard");
    expect(keys).toContain("track-name");
    expect(keys).toContain("action-start-resume");
    expect(keys).toContain("action-pause");
    expect(keys).toContain("action-next-heat");
    expect(keys).toContain("action-restart-heat");
    expect(keys).toContain("action-defer-heat");
    expect(keys).toContain("action-skip-heat");
    expect(keys).toContain("action-skip-race");
    expect(keys).toContain("action-add-lap");
    expect(keys).toContain("action-modify-heats");
    expect(keys).toContain("action-export-pdf");
    expect(keys).toContain("action-export-csv");
    expect(keys).toContain("action-export-xls");
    expect(keys).toContain("action-open-heat-results");
    expect(keys).toContain("action-open-race-results");
    expect(keys).toContain("action-open-season-results");
    expect(keys).toContain("action-open-prediction-results");
    expect(keys).toContain("action-master-power-on");
    expect(keys).toContain("action-master-power-off");
  });

  it("should generate valid default settings for every registered widget", () => {
    for (const [widgetType, entry] of Object.entries(WIDGET_REGISTRY)) {
      if (entry.defaultSettings) {
        const settings = entry.defaultSettings();
        expect(settings).toBeDefined(
          `Expected defaultSettings for ${widgetType}`,
        );
        expect(typeof settings).toBe("object");
      }
    }
  });

  it("should generate specific settings for complex widgets", () => {
    const laneViewSettings = WIDGET_REGISTRY["lane-view"].defaultSettings!();
    expect(laneViewSettings["isVertical"]).toBe(false);
    expect(laneViewSettings["dataFontSize"]).toBe(54);

    const leaderboardSettings =
      WIDGET_REGISTRY["leaderboard"].defaultSettings!();
    expect(leaderboardSettings["decimalPlaces"]).toBe(3);

    const actionSettings =
      WIDGET_REGISTRY["action-start-resume"].defaultSettings!();
    expect(actionSettings["fontSize"]).toBe(24);
  });
});
