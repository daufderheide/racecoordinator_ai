export abstract class RaceHistoryDialogHarnessBase {
  static readonly hostSelector = "app-race-history-dialog";

  static readonly selectors = {
    backdrop: ".race-history-backdrop",
    container: ".race-history-container",
    closeBtn: ".close-btn",
    searchInput: ".search-input",
    clearSearchBtn: ".clear-search-btn",
    raceCards: ".race-card",
    emptyState: ".empty-state",
    loadingState: ".loading-state",
  };

  abstract isVisible(): Promise<boolean>;
  abstract dismiss(): Promise<void>;
  abstract search(query: string): Promise<void>;
  abstract getSearchValue(): Promise<string>;
  abstract getRaceCardCount(): Promise<number>;
}
