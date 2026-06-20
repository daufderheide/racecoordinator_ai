export abstract class LeaderboardInspectorHarnessBase {
  static readonly hostSelector = "app-leaderboard-inspector";

  static readonly selectors = {
    selects: "select",
    sliders: "input[type='range']",
    colorPickers: "input[type='color']",
    resetButtons: ".color-reset-btn",
  };

  abstract getTitleFontFamily(): Promise<string>;
  abstract setTitleFontFamily(val: string): Promise<void>;
  abstract getTitleFontSize(): Promise<number>;
  abstract setTitleFontSize(val: number): Promise<void>;
  abstract getTitleTextColor(): Promise<string>;
  abstract setTitleTextColor(val: string): Promise<void>;
  abstract clickResetTitleTextColor(): Promise<void>;

  abstract getOverallLeaderFontFamily(): Promise<string>;
  abstract setOverallLeaderFontFamily(val: string): Promise<void>;
  abstract getOverallLeaderFontSize(): Promise<number>;
  abstract setOverallLeaderFontSize(val: number): Promise<void>;
  abstract getOverallLeaderTextColor(): Promise<string>;
  abstract setOverallLeaderTextColor(val: string): Promise<void>;
  abstract clickResetOverallLeaderTextColor(): Promise<void>;

  abstract getRestFontFamily(): Promise<string>;
  abstract setRestFontFamily(val: string): Promise<void>;
  abstract getRestFontSize(): Promise<number>;
  abstract setRestFontSize(val: number): Promise<void>;
  abstract getRestTextColor(): Promise<string>;
  abstract setRestTextColor(val: string): Promise<void>;
  abstract clickResetRestTextColor(): Promise<void>;
}
