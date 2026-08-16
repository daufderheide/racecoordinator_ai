export abstract class RaceManagerHarnessBase {
  static readonly hostSelector = "app-race-manager";

  static readonly selectors = {
    container: ".page-container",
    listContainer: ".list-container",
    detailPanel: ".detail-panel",
    listItem: ".list-item",
    selectedItem: ".list-item.selected",
  };

  abstract exists(): Promise<boolean>;
}
