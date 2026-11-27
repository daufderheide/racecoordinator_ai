import { resultsLayoutTemplate } from "@app/components/shared/results-layout/results-layout.model";

export function heatResultsLayoutTemplate() {
  return resultsLayoutTemplate("heat-results");
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
