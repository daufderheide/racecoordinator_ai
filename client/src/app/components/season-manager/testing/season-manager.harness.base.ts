export abstract class SeasonManagerHarnessBase {
  static readonly hostSelector = "app-season-manager";

  static readonly selectors = {
    listContainer: ".list-container",
    listItem: ".list-item",
    selectedItem: ".list-item.selected",
    detailPanel: ".detail-panel",
    searchBarInput: ".search-bar input",
    standingsHeader: ".standings-header-container",
    standingsBody: ".standings-body-container",
    standingsRows: ".standings-body-container tbody tr",
    createButton: "app-manager-header button:has-text('+')",
    editButton: "app-manager-header button:has-text('Edit')",
    deleteButton: "app-manager-header button:has-text('Delete')",
  };

  abstract getSeasonCount(): Promise<number>;
  abstract selectSeason(index: number): Promise<void>;
  abstract getSelectedSeasonName(): Promise<string>;
  abstract searchSeasons(query: string): Promise<void>;
  abstract getStandingsCount(): Promise<number>;
}
