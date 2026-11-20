import { getRacedayLayoutForSettings, Settings } from "@app/models/settings";

import { RacedayActiveLayoutHelper } from "./raceday-active-layout.helper";
import { RacedayColumnLayoutHelper } from "./raceday-column-layout.helper";

describe("RacedayActiveLayoutHelper", () => {
  it("uses the factory presets for default column settings in any map key order", () => {
    const settings = new Settings();
    settings.columnLayouts = Object.fromEntries(
      Object.entries(settings.columnLayouts).reverse(),
    );
    settings.practiceColumnLayouts = Object.fromEntries(
      Object.entries(settings.practiceColumnLayouts).reverse(),
    );
    expect(getRacedayLayoutForSettings(settings, false)).toEqual(
      Settings.DEFAULT_LAYOUT,
    );
    expect(getRacedayLayoutForSettings(settings, true)).toEqual(
      Settings.DEFAULT_PRACTICE_LAYOUT,
    );
  });

  it("uses the native table when just one column setting is customized", () => {
    for (const changes of [
      { racedayColumns: ["mph"] },
      { columnWidths: { averageLapTime: 480 } },
      { columnLayouts: { mph: { "top-right": "gapPositionF1" } } },
      { columnAnchors: { mph: "bottom-right" } },
      { columnVisibility: {} },
    ]) {
      const settings = Object.assign(new Settings(), changes);
      expect(
        getRacedayLayoutForSettings(settings, false).widgets.some(
          (w) => w.widgetType === "lane-view",
        ),
      ).toBeTrue();
      expect(getRacedayLayoutForSettings(settings, true)).toEqual(
        Settings.DEFAULT_PRACTICE_LAYOUT,
      );
    }
  });

  for (const isPractice of [false, true]) {
    const mode = isPractice ? "practice" : "race";
    it(`uses saved ${mode} columns and widths when no layout is configured`, () => {
      const settings = new Settings();
      settings.racedayColumns = ["averageLapTime", "lapCount"];
      settings.columnWidths = { averageLapTime: 103, lapCount: 211 };
      settings.practiceRacedayColumns = ["bestLapTime", "lapCount"];
      settings.practiceColumnWidths = { bestLapTime: 315, lapCount: 147 };
      const host = {
        isPracticeLayout: isPractice,
        isUIEditorMode: () => false,
        editingSettings: () => undefined,
        settingsService: { getSettingsSnapshot: () => settings },
        themeService: { getActiveTheme: () => undefined },
      };

      const layout = RacedayActiveLayoutHelper.getCurrentRacedayLayout(host)!;
      const template = isPractice
        ? Settings.LEGACY_DEFAULT_PRACTICE_LAYOUT
        : Settings.LEGACY_DEFAULT_LAYOUT;
      const table = layout.widgets.find((w) => w.widgetType === "lane-view");
      expect(table).toBeDefined();
      expect(table).not.toBe(
        template.widgets.find((w) => w.widgetType === "lane-view"),
      );
      expect(table?.customSettings?.["isVertical"]).toBe(isPractice);

      const columns = RacedayActiveLayoutHelper.getCurrentRacedayColumns(host);
      const widths = RacedayActiveLayoutHelper.getCurrentColumnWidths(host);
      const { calculatedWidths } =
        RacedayColumnLayoutHelper.resolveColumnLayout(
          {
            currentRacedayLayout: layout,
            currentColumnWidths: widths,
            dashboardWidth: 1920,
          },
          columns,
          settings,
        );
      expect(columns).toEqual(
        isPractice ? settings.practiceRacedayColumns : settings.racedayColumns,
      );
      expect(calculatedWidths).toEqual(
        isPractice ? settings.practiceColumnWidths : settings.columnWidths,
      );
    });
  }
});
