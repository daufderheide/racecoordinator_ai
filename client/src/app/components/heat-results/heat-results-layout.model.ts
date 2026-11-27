import { CustomUI } from "@app/models/custom-ui";
import { LayoutConfig } from "@app/models/settings";

export const HEAT_RESULTS_LAYOUT_TEMPLATE = "heat-results-template";

export const HEAT_RESULTS_WIDGETS = [
  {
    type: "heat-results-selector",
    labelKey: "UE_WIDGET_TYPE_HEAT_RESULTS_SELECTOR",
    icon: "list_alt",
  },
  {
    type: "heat-results-standings",
    labelKey: "UE_WIDGET_TYPE_HEAT_RESULTS_STANDINGS",
    icon: "leaderboard",
  },
  { type: "label", labelKey: "UE_WIDGET_TYPE_LABEL", icon: "title" },
  { type: "image", labelKey: "UE_WIDGET_TYPE_IMAGE", icon: "image" },
] as const;

export function supportsHeatResultsWidget(type: string | undefined): boolean {
  return HEAT_RESULTS_WIDGETS.some((widget) => widget.type === type);
}

export function readHeatResultsLayout(ui: CustomUI): LayoutConfig | null {
  try {
    const layout = JSON.parse(ui.layoutJson || "null") as LayoutConfig | null;
    return layout?.purpose === "heat-results" && Array.isArray(layout.widgets)
      ? layout
      : null;
  } catch {
    return null;
  }
}

export function heatResultsLayoutTemplate(): CustomUI {
  const layout: LayoutConfig = {
    purpose: "heat-results",
    baseWidth: 1200,
    baseHeight: 540,
    aspectRatio: "1200:540",
    scaleMode: "fit-width",
    widgets: [
      {
        id: "heat-selector",
        widgetType: "heat-results-selector",
        x: 30,
        y: 20,
        width: 460,
        height: 66,
        zIndex: 2,
        fontSize: 16,
        scaleMode: "fixed",
      },
      {
        id: "heat-standings",
        widgetType: "heat-results-standings",
        x: 30,
        y: 102,
        width: 1140,
        height: 412,
        zIndex: 1,
        fontSize: 18,
        scaleMode: "fixed",
      },
    ],
  };
  return {
    entity_id: HEAT_RESULTS_LAYOUT_TEMPLATE,
    is_default: true,
    name: "Heat Results",
    layoutJson: JSON.stringify(layout),
  };
}

export const HEAT_RESULTS_COLUMNS = [
  {
    key: "position",
    labelKey: "HL_SUMMARY_POS",
    setting: "showPosition",
    format: "1.0-0",
  },
  { key: "driver", labelKey: "HL_SUMMARY_DRIVER" },
  { key: "lane", labelKey: "RD_LANE", setting: "showLane", format: "1.0-0" },
  {
    key: "laps",
    labelKey: "HL_SUMMARY_LAPS",
    setting: "showLaps",
    format: "1.0-3",
  },
  {
    key: "bestLap",
    labelKey: "HL_SUMMARY_BEST_LAP",
    setting: "showBestLap",
    format: "1.3-3",
  },
  {
    key: "averageLap",
    labelKey: "HL_SUMMARY_AVG_LAP",
    setting: "showAverageLap",
    format: "1.3-3",
  },
  {
    key: "gap",
    labelKey: "HL_SUMMARY_GAP",
    setting: "showGap",
    format: "1.3-3",
  },
] as const;

export const HEAT_RESULTS_STANDINGS_COLUMNS = HEAT_RESULTS_COLUMNS.filter(
  (column) => "setting" in column,
);
