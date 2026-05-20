export abstract class RaceResultsHarnessBase {
  static readonly hostSelector = "app-race-results";

  static readonly selectors = {
    resultsTableHeader: ".results-table-header",
    resultsTableBody: ".results-table-body",
    resultsSvgGraphs: ".results-svg-graphs",
    rankingsGraph: ".rankings-graph",
    laptimesGraph: ".laptimes-graph",
    driverRow: ".driver-row",
    driverGroup: ".driver-group",
    legendItem: ".legend-item",
  };

  abstract hasResultsTableHeader(): Promise<boolean>;
  abstract hasResultsTableBody(): Promise<boolean>;
  abstract hasResultsSvgGraphs(): Promise<boolean>;
  abstract hasRankingsGraph(): Promise<boolean>;
  abstract hasLaptimesGraph(): Promise<boolean>;
  abstract getDriverRowCount(): Promise<number>;
  abstract getLegendItemCount(): Promise<number>;
  abstract getDriverGroupCount(): Promise<number>;
}
