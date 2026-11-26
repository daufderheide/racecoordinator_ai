export const RACE_STANDINGS_COLUMNS = [
  {
    key: "rank",
    labelKey: "RD_COL_RANK_OVERALL",
    setting: "showPosition",
    format: "1.0-0",
  },
  { key: "driver", labelKey: "RM_LABEL_DRIVER" },
  { key: "score", labelKey: "DR_COL_SCORE", setting: "showScore" },
  { key: "laps", labelKey: "RD_COL_LAP", setting: "showLaps", format: "1.2-2" },
  {
    key: "averageLapTime",
    labelKey: "RD_COL_AVG_LAP",
    setting: "showAverageLap",
    format: "1.3-3",
  },
  {
    key: "bestLapTime",
    labelKey: "RD_COL_BEST_LAP",
    setting: "showBestLap",
    format: "1.3-3",
  },
  { key: "gap1st", labelKey: "RD_COL_GAP_LEADER", setting: "showGap" },
] as const;

export const RACE_STANDINGS_OPTIONAL_COLUMNS = RACE_STANDINGS_COLUMNS.filter(
  (column) => "setting" in column,
);
