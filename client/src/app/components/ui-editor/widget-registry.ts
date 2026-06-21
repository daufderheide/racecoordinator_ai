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
      timeDecimalPlaces: 3,
      lapDecimalPlaces: 2,
    }),
  },
};
