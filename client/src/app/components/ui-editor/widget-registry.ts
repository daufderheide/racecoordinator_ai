export interface WidgetRegistryEntry {
  defaultSettings?: () => Record<string, any>;
}

export const WIDGET_REGISTRY: Record<string, WidgetRegistryEntry> = {
  leaderboard: {
    defaultSettings: () => ({
      decimalPlaces: 3,
      titleFontFamily: "",
      titleFontSize: 18,
      titleTextColor: "",
      overallLeaderFontFamily: "",
      overallLeaderFontSize: 16,
      overallLeaderTextColor: "",
      restFontFamily: "",
      restFontSize: 16,
      restTextColor: "",
    }),
  },
  records: {
    defaultSettings: () => ({
      headerFontFamily: "",
      headerFontSize: 17,
      headerTextColor: "",
      valueFontFamily: "",
      valueFontSize: 19,
      valueTextColor: "",
    }),
  },
  timer: {
    defaultSettings: () => ({
      timeFontFamily: "",
      timeFontSize: 100,
      timeTextColor: "",
    }),
  },
  image: {
    defaultSettings: () => ({
      imageUrl: "",
    }),
  },
  "lane-view": {
    defaultSettings: () => ({
      isVertical: false,
      timeDecimalPlaces: 3,
      lapDecimalPlaces: 2,
      columnFontFamily: "",
      columnFontSize: 24,
      columnTextColor: "",
      dataFontFamily: "",
      dataFontSize: 54,
      dataTextColor: "",
      insetTimeDecimalPlaces: 3,
      insetLapDecimalPlaces: 2,
      insetFontFamily: "",
      insetFontSize: 24,
      insetTextColor: "",
    }),
  },
  "on-deck": {
    defaultSettings: () => ({
      titleFontFamily: "",
      titleFontSize: 18,
      titleTextColor: "",
      laneFontFamily: "",
      laneFontSize: 16,
      laneTextColor: "",
    }),
  },
  "next-heat": {
    defaultSettings: () => ({
      titleFontFamily: "",
      titleFontSize: 18,
      titleTextColor: "",
      laneFontFamily: "",
      laneFontSize: 16,
      laneTextColor: "",
    }),
  },
  "group-leaderboard": {
    defaultSettings: () => ({
      decimalPlaces: 3,
      titleFontFamily: "",
      titleFontSize: 18,
      titleTextColor: "",
      subtitleFontFamily: "",
      subtitleFontSize: 13,
      subtitleTextColor: "",
      overallLeaderFontFamily: "",
      overallLeaderFontSize: 16,
      overallLeaderTextColor: "",
      restFontFamily: "",
      restFontSize: 16,
      restTextColor: "",
    }),
  },
  "heat-info": {
    defaultSettings: () => ({
      labelFontFamily: "",
      labelFontSize: 13,
      labelTextColor: "",
      valueFontFamily: "",
      valueFontSize: 18,
      valueTextColor: "",
    }),
  },
  "race-name": {
    defaultSettings: () => ({
      labelFontFamily: "",
      labelFontSize: 13,
      labelTextColor: "",
      valueFontFamily: "",
      valueFontSize: 18,
      valueTextColor: "",
    }),
  },
  "track-name": {
    defaultSettings: () => ({
      labelFontFamily: "",
      labelFontSize: 13,
      labelTextColor: "",
      valueFontFamily: "",
      valueFontSize: 18,
      valueTextColor: "",
    }),
  },
  "action-start-resume": {
    defaultSettings: () => ({
      fontFamily: "",
      fontSize: 24,
      textColor: "",
      backgroundColor: "",
      shortcut: "",
    }),
  },
  "action-pause": {
    defaultSettings: () => ({
      fontFamily: "",
      fontSize: 24,
      textColor: "",
      backgroundColor: "",
      shortcut: "",
    }),
  },
  "action-next-heat": {
    defaultSettings: () => ({
      fontFamily: "",
      fontSize: 24,
      textColor: "",
      backgroundColor: "",
      shortcut: "",
    }),
  },
  "action-restart-heat": {
    defaultSettings: () => ({
      fontFamily: "",
      fontSize: 24,
      textColor: "",
      backgroundColor: "",
      shortcut: "",
    }),
  },
  "action-defer-heat": {
    defaultSettings: () => ({
      fontFamily: "",
      fontSize: 24,
      textColor: "",
      backgroundColor: "",
      shortcut: "",
    }),
  },
  "action-skip-heat": {
    defaultSettings: () => ({
      fontFamily: "",
      fontSize: 24,
      textColor: "",
      backgroundColor: "",
      shortcut: "",
    }),
  },
  "action-skip-race": {
    defaultSettings: () => ({
      fontFamily: "",
      fontSize: 24,
      textColor: "",
      backgroundColor: "",
      shortcut: "",
    }),
  },
  "action-add-lap": {
    defaultSettings: () => ({
      fontFamily: "",
      fontSize: 24,
      textColor: "",
      backgroundColor: "",
      shortcut: "",
    }),
  },
  "action-modify-heats": {
    defaultSettings: () => ({
      fontFamily: "",
      fontSize: 24,
      textColor: "",
      backgroundColor: "",
      shortcut: "",
    }),
  },
  "action-export-pdf": {
    defaultSettings: () => ({
      fontFamily: "",
      fontSize: 24,
      textColor: "",
      backgroundColor: "",
      shortcut: "",
    }),
  },
  "action-export-csv": {
    defaultSettings: () => ({
      fontFamily: "",
      fontSize: 24,
      textColor: "",
      backgroundColor: "",
      shortcut: "",
    }),
  },
  "action-open-heat-results": {
    defaultSettings: () => ({
      fontFamily: "",
      fontSize: 24,
      textColor: "",
      backgroundColor: "",
      shortcut: "",
    }),
  },
  "action-open-race-results": {
    defaultSettings: () => ({
      fontFamily: "",
      fontSize: 24,
      textColor: "",
      backgroundColor: "",
      shortcut: "",
    }),
  },
};
