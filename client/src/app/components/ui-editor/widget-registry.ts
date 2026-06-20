export interface WidgetRegistryEntry {
  defaultSettings?: () => Record<string, any>;
}

export const WIDGET_REGISTRY: Record<string, WidgetRegistryEntry> = {
  leaderboard: {
    defaultSettings: () => ({
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
};
