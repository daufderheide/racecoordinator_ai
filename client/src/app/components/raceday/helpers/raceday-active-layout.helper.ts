import { AnchorPoint } from "@app/components/raceday/column_definition";
import { LaneViewMigrationHelper } from "@app/components/raceday/utils/lane-view-migration.helper";
import {
  isLegacyDriverStationThemeName,
  isLegacyDriverStationUiName,
} from "@app/components/ui-editor/ui-editor-crud.helper";
import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig, Settings } from "@app/models/settings";

export class RacedayActiveLayoutHelper {
  static isDriverStationLayout(host: any): boolean {
    if (host.isUIEditorMode() && host.activeCustomUi()) {
      const entityId = host.activeCustomUi()!.entity_id;
      const name = host.activeCustomUi()!.name || "";
      return (
        entityId === "driver_station_ui_layout_rc_ai" ||
        isLegacyDriverStationUiName(name)
      );
    }
    const hasThemeQueryParam = Boolean(
      host.route?.snapshot?.queryParams?.["themeId"],
    );
    const activeTheme = host.themeService.getActiveTheme();
    if (
      activeTheme &&
      (hasThemeQueryParam || host.activeLaneIndex !== undefined)
    ) {
      if (
        activeTheme.entity_id === "driver_station_theme_rc_ai" ||
        activeTheme.uiId === "driver_station_ui_layout_rc_ai" ||
        isLegacyDriverStationThemeName(activeTheme.name || "")
      ) {
        return true;
      }
    }
    return host.activeLaneIndex !== undefined;
  }

  static getActiveLane(host: any): any | undefined {
    if (host.activeLaneIndex === undefined) return undefined;
    const track =
      host.track || host.race?.track || host.raceService.getRace()?.track;
    return track?.lanes?.[host.activeLaneIndex];
  }

  static getActiveLaneBackgroundColor(host: any): string {
    if (host.isUIEditorMode()) {
      return "#ffffff";
    }
    return host.activeLane?.background_color || "#ffffff";
  }

  static getActiveLaneForegroundColor(host: any): string {
    if (host.isUIEditorMode()) {
      return "#000000";
    }
    return host.activeLane?.foreground_color || "#000000";
  }

  static getSeasonName(host: any): string {
    return (
      (host.race as any)?.season_name ||
      (host.race as any)?.seasonName ||
      (host.isUIEditorMode() ? "Mock Editor Season" : "")
    );
  }

  static getSeasonStandings(host: any): any[] {
    const standings =
      (host.race as any)?.season_standings ||
      (host.race as any)?.seasonStandings;
    if (standings && standings.length > 0) return standings;
    return host.isUIEditorMode()
      ? [
          {
            driver_id: "d1",
            driver_name: "Mario",
            net_points: 150,
            gross_points: 175,
            races_run: 5,
            current_race_points: 25,
          },
          {
            driver_id: "d2",
            driver_name: "Luigi",
            net_points: 135,
            gross_points: 150,
            races_run: 5,
            current_race_points: 20,
          },
          {
            driver_id: "d3",
            driver_name: "Bowser",
            net_points: 120,
            gross_points: 140,
            races_run: 5,
            current_race_points: 18,
          },
          {
            driver_id: "d4",
            driver_name: "Peach",
            net_points: 110,
            gross_points: 125,
            races_run: 5,
            current_race_points: 15,
          },
          {
            driver_id: "d5",
            driver_name: "Yoshi",
            net_points: 95,
            gross_points: 105,
            races_run: 4,
            current_race_points: 12,
          },
          {
            driver_id: "d6",
            driver_name: "Donkey Kong",
            net_points: 80,
            gross_points: 90,
            races_run: 4,
            current_race_points: 10,
          },
        ]
      : [];
  }

  static getParsedCustomUiProperty(
    host: any,
    customUI: any,
    propName: string,
    fallbackVal: any,
  ): any {
    if (!customUI) return fallbackVal;
    const jsonStr = customUI[propName] as string;
    if (!jsonStr) return fallbackVal;

    if (!host.parsedThemeLayouts) {
      host.parsedThemeLayouts = new Map<string, any>();
    }
    if (!host.parsedThemeLayouts.has(jsonStr)) {
      try {
        host.parsedThemeLayouts.set(jsonStr, JSON.parse(jsonStr));
      } catch (e) {
        host.parsedThemeLayouts.set(jsonStr, fallbackVal);
      }
    }
    return host.parsedThemeLayouts.get(jsonStr);
  }

  static getCurrentRacedayLayout(host: any): LayoutConfig | undefined {
    if (host.isUIEditorMode() && host.activeCustomUi()) {
      const ui = host.activeCustomUi()!;
      if (ui.layoutJson && ui.layoutJson !== "[]") {
        return RacedayActiveLayoutHelper.getParsedCustomUiProperty(
          host,
          ui,
          "layoutJson",
          undefined,
        );
      }
      if (host.isDriverStationLayout) {
        return JSON.parse(
          JSON.stringify(Settings.DEFAULT_DRIVER_STATION_LAYOUT),
        );
      }
      return host.isPracticeLayout
        ? host.editingSettings()?.practiceRacedayLayout ||
            JSON.parse(JSON.stringify(Settings.DEFAULT_PRACTICE_LAYOUT))
        : host.editingSettings()?.racedayLayout ||
            JSON.parse(JSON.stringify(Settings.DEFAULT_LAYOUT));
    }
    if (host.editingSettings()) {
      if (host.isDriverStationLayout || host.isDriverStation) {
        return JSON.parse(
          JSON.stringify(Settings.DEFAULT_DRIVER_STATION_LAYOUT),
        );
      }
      return host.isPracticeLayout
        ? host.editingSettings()!.practiceRacedayLayout
        : host.editingSettings()!.racedayLayout;
    }
    const settings = host.settingsService.getSettings();
    let customUI: CustomUI | undefined;
    const activeTheme = host.themeService.getActiveTheme();
    if (host.isDriverStationLayout || host.isDriverStation) {
      if (activeTheme?.uiId) {
        customUI = host.customUiService.getCustomUI(activeTheme.uiId);
      }
      if (!customUI) {
        customUI = host.customUiService.getCustomUI(
          "driver_station_ui_layout_rc_ai",
        );
      }
    } else {
      customUI =
        activeTheme && activeTheme.uiId
          ? host.customUiService.getCustomUI(activeTheme.uiId)
          : undefined;
    }
    const fallbackLayout =
      host.isDriverStationLayout || host.isDriverStation
        ? JSON.parse(JSON.stringify(Settings.DEFAULT_DRIVER_STATION_LAYOUT))
        : host.isPracticeLayout
          ? settings.practiceRacedayLayout
          : settings.racedayLayout;
    const resolvedLayout =
      host.isDriverStationLayout || host.isDriverStation
        ? RacedayActiveLayoutHelper.getParsedCustomUiProperty(
            host,
            customUI,
            "layoutJson",
            fallbackLayout,
          )
        : host.isPracticeLayout
          ? RacedayActiveLayoutHelper.getParsedCustomUiProperty(
              host,
              customUI,
              "layoutJson",
              settings.practiceRacedayLayout,
            )
          : RacedayActiveLayoutHelper.getParsedCustomUiProperty(
              host,
              customUI,
              "layoutJson",
              settings.racedayLayout,
            );
    if (
      !host.isUIEditorMode() &&
      LaneViewMigrationHelper.hasLegacyLaneView(resolvedLayout)
    ) {
      const migration = LaneViewMigrationHelper.convertLegacyLaneViewLayout({
        layout: resolvedLayout,
        columns: host.currentRacedayColumns,
        columnLayouts: host.currentColumnLayouts,
        columnWidths: host.currentColumnWidths,
        columnAnchors: host.currentColumnAnchors,
        totalLanes: host.track?.lanes?.length || 4,
        isPractice: host.isPracticeLayout,
      });
      if (migration.migrated) {
        LaneViewMigrationHelper.migrateGapWidgets(migration.layout);
        return migration.layout;
      }
    }
    LaneViewMigrationHelper.migrateGapWidgets(resolvedLayout);
    return resolvedLayout;
  }

  static setCurrentRacedayLayout(
    host: any,
    layout: LayoutConfig | undefined,
  ): void {
    if (host.isUIEditorMode() && host.activeCustomUi()) {
      const ui = host.activeCustomUi()!;
      ui.layoutJson = layout ? JSON.stringify(layout) : "";
      if (
        ui.entity_id === "default_ui_layout_rc_ai" &&
        host.editingSettings()
      ) {
        host.editingSettings()!.racedayLayout = layout;
      } else if (
        ui.entity_id === "practice_ui_layout_rc_ai" &&
        host.editingSettings()
      ) {
        host.editingSettings()!.practiceRacedayLayout = layout;
      }
      return;
    }
    const settings =
      host.editingSettings() || host.settingsService.getSettings();
    if (host.isPracticeLayout) settings.practiceRacedayLayout = layout;
    else settings.racedayLayout = layout;
  }

  static getCurrentRacedayColumns(host: any): string[] {
    if (host.isUIEditorMode() && host.activeCustomUi()) {
      const ui = host.activeCustomUi()!;
      if (ui.columnsJson) {
        return RacedayActiveLayoutHelper.getParsedCustomUiProperty(
          host,
          ui,
          "columnsJson",
          [],
        );
      }
      return host.isPracticeLayout
        ? host.editingSettings()?.practiceRacedayColumns || []
        : host.editingSettings()?.racedayColumns || [];
    }
    if (host.editingSettings()) {
      return host.isPracticeLayout
        ? host.editingSettings()!.practiceRacedayColumns || []
        : host.editingSettings()!.racedayColumns || [];
    }
    const settings = host.settingsService.getSettings();
    const activeTheme = host.themeService.getActiveTheme();
    const customUI =
      activeTheme && activeTheme.uiId
        ? host.customUiService.getCustomUI(activeTheme.uiId)
        : undefined;
    return host.isPracticeLayout
      ? RacedayActiveLayoutHelper.getParsedCustomUiProperty(
          host,
          customUI,
          "columnsJson",
          settings.practiceRacedayColumns || [],
        )
      : RacedayActiveLayoutHelper.getParsedCustomUiProperty(
          host,
          customUI,
          "columnsJson",
          settings.racedayColumns || [],
        );
  }

  static setCurrentRacedayColumns(host: any, cols: string[]): void {
    if (host.isUIEditorMode() && host.activeCustomUi()) {
      const ui = host.activeCustomUi()!;
      ui.columnsJson = JSON.stringify(cols);
      if (
        ui.entity_id === "default_ui_layout_rc_ai" &&
        host.editingSettings()
      ) {
        host.editingSettings()!.racedayColumns = cols;
      } else if (
        ui.entity_id === "practice_ui_layout_rc_ai" &&
        host.editingSettings()
      ) {
        host.editingSettings()!.practiceRacedayColumns = cols;
      }
      return;
    }
    const settings =
      host.editingSettings() || host.settingsService.getSettings();
    if (host.isPracticeLayout) settings.practiceRacedayColumns = cols;
    else settings.racedayColumns = cols;
  }

  static getCurrentColumnAnchors(host: any): { [key: string]: AnchorPoint } {
    if (host.isUIEditorMode() && host.activeCustomUi()) {
      const ui = host.activeCustomUi()!;
      if (ui.columnAnchorsJson) {
        return RacedayActiveLayoutHelper.getParsedCustomUiProperty(
          host,
          ui,
          "columnAnchorsJson",
          {},
        );
      }
      return host.isPracticeLayout
        ? host.editingSettings()?.practiceColumnAnchors || {}
        : host.editingSettings()?.columnAnchors || {};
    }
    if (host.editingSettings()) {
      return host.isPracticeLayout
        ? host.editingSettings()!.practiceColumnAnchors || {}
        : host.editingSettings()!.columnAnchors || {};
    }
    const settings = host.settingsService.getSettings();
    const activeTheme = host.themeService.getActiveTheme();
    const customUI =
      activeTheme && activeTheme.uiId
        ? host.customUiService.getCustomUI(activeTheme.uiId)
        : undefined;
    return host.isPracticeLayout
      ? RacedayActiveLayoutHelper.getParsedCustomUiProperty(
          host,
          customUI,
          "columnAnchorsJson",
          settings.practiceColumnAnchors || {},
        )
      : RacedayActiveLayoutHelper.getParsedCustomUiProperty(
          host,
          customUI,
          "columnAnchorsJson",
          settings.columnAnchors || {},
        );
  }

  static setCurrentColumnAnchors(
    host: any,
    anchors: { [key: string]: AnchorPoint },
  ): void {
    if (host.isUIEditorMode() && host.activeCustomUi()) {
      const ui = host.activeCustomUi()!;
      ui.columnAnchorsJson = JSON.stringify(anchors);
      if (
        ui.entity_id === "default_ui_layout_rc_ai" &&
        host.editingSettings()
      ) {
        host.editingSettings()!.columnAnchors = anchors;
      } else if (
        ui.entity_id === "practice_ui_layout_rc_ai" &&
        host.editingSettings()
      ) {
        host.editingSettings()!.practiceColumnAnchors = anchors;
      }
      return;
    }
    const settings =
      host.editingSettings() || host.settingsService.getSettings();
    if (host.isPracticeLayout) settings.practiceColumnAnchors = anchors;
    else settings.columnAnchors = anchors;
  }

  static getCurrentColumnLayouts(host: any): {
    [columnKey: string]: { [A in AnchorPoint]?: string };
  } {
    if (host.isUIEditorMode() && host.activeCustomUi()) {
      const ui = host.activeCustomUi()!;
      if (ui.columnLayoutsJson) {
        return RacedayActiveLayoutHelper.getParsedCustomUiProperty(
          host,
          ui,
          "columnLayoutsJson",
          {},
        );
      }
      return host.isPracticeLayout
        ? host.editingSettings()?.practiceColumnLayouts || {}
        : host.editingSettings()?.columnLayouts || {};
    }
    if (host.editingSettings()) {
      return host.isPracticeLayout
        ? host.editingSettings()!.practiceColumnLayouts || {}
        : host.editingSettings()!.columnLayouts || {};
    }
    const settings = host.settingsService.getSettings();
    const activeTheme = host.themeService.getActiveTheme();
    const customUI =
      activeTheme && activeTheme.uiId
        ? host.customUiService.getCustomUI(activeTheme.uiId)
        : undefined;
    return host.isPracticeLayout
      ? RacedayActiveLayoutHelper.getParsedCustomUiProperty(
          host,
          customUI,
          "columnLayoutsJson",
          settings.practiceColumnLayouts || {},
        )
      : RacedayActiveLayoutHelper.getParsedCustomUiProperty(
          host,
          customUI,
          "columnLayoutsJson",
          settings.columnLayouts || {},
        );
  }

  static setCurrentColumnLayouts(
    host: any,
    layouts: { [columnKey: string]: { [A in AnchorPoint]?: string } },
  ): void {
    if (host.isUIEditorMode() && host.activeCustomUi()) {
      const ui = host.activeCustomUi()!;
      ui.columnLayoutsJson = JSON.stringify(layouts);
      if (
        ui.entity_id === "default_ui_layout_rc_ai" &&
        host.editingSettings()
      ) {
        host.editingSettings()!.columnLayouts = layouts;
      } else if (
        ui.entity_id === "practice_ui_layout_rc_ai" &&
        host.editingSettings()
      ) {
        host.editingSettings()!.practiceColumnLayouts = layouts;
      }
      return;
    }
    const settings =
      host.editingSettings() || host.settingsService.getSettings();
    if (host.isPracticeLayout) settings.practiceColumnLayouts = layouts;
    else settings.columnLayouts = layouts;
  }

  static getCurrentColumnWidths(host: any): { [columnKey: string]: number } {
    if (host.isUIEditorMode() && host.activeCustomUi()) {
      const ui = host.activeCustomUi()!;
      if (ui.columnWidthsJson) {
        return RacedayActiveLayoutHelper.getParsedCustomUiProperty(
          host,
          ui,
          "columnWidthsJson",
          {},
        );
      }
      return host.isPracticeLayout
        ? host.editingSettings()?.practiceColumnWidths || {}
        : host.editingSettings()?.columnWidths || {};
    }
    if (host.editingSettings()) {
      return host.isPracticeLayout
        ? host.editingSettings()!.practiceColumnWidths || {}
        : host.editingSettings()!.columnWidths || {};
    }
    const settings = host.settingsService.getSettings();
    const activeTheme = host.themeService.getActiveTheme();
    const customUI =
      activeTheme && activeTheme.uiId
        ? host.customUiService.getCustomUI(activeTheme.uiId)
        : undefined;
    return host.isPracticeLayout
      ? RacedayActiveLayoutHelper.getParsedCustomUiProperty(
          host,
          customUI,
          "columnWidthsJson",
          settings.practiceColumnWidths || {},
        )
      : RacedayActiveLayoutHelper.getParsedCustomUiProperty(
          host,
          customUI,
          "columnWidthsJson",
          settings.columnWidths || {},
        );
  }

  static setCurrentColumnWidths(
    host: any,
    widths: { [columnKey: string]: number },
  ): void {
    if (host.isUIEditorMode() && host.activeCustomUi()) {
      const ui = host.activeCustomUi()!;
      ui.columnWidthsJson = JSON.stringify(widths);
      if (
        ui.entity_id === "default_ui_layout_rc_ai" &&
        host.editingSettings()
      ) {
        host.editingSettings()!.columnWidths = widths;
      } else if (
        ui.entity_id === "practice_ui_layout_rc_ai" &&
        host.editingSettings()
      ) {
        host.editingSettings()!.practiceColumnWidths = widths;
      }
      return;
    }
    const settings =
      host.editingSettings() || host.settingsService.getSettings();
    if (host.isPracticeLayout) settings.practiceColumnWidths = widths;
    else settings.columnWidths = widths;
  }

  static updateRacedayLayout(host: any): void {
    if (host.isUIEditorMode()) {
      return;
    }
    if (host.parsedThemeLayouts) {
      host.parsedThemeLayouts.clear();
    } else {
      host.parsedThemeLayouts = new Map<string, any>();
    }
    host.invalidateGridCache();
    if (host.currentRacedayLayout && host.currentRacedayLayout.widgets) {
      host.layout = JSON.parse(JSON.stringify(host.currentRacedayLayout));
    } else {
      host.layout = host.getDefaultLayout();
    }
    host.updateScale();
    host.loadColumns();
    if (host.heat) {
      host.sortHeatDrivers();
    }
    host.updateAudioRelevance();
    host.cdr.markForCheck();
  }
}
