export abstract class SeasonSummaryHarnessBase {
  static readonly hostSelector = "app-season-summary";

  static readonly selectors = {
    detailHeader: ".detail-header",
    seasonName: "#season-detail-name",
    metaPills: ".meta-pill",
    dropsCount: "#season-detail-drops",
    racesRun: "#season-detail-races",
    demoBadge: "#season-detail-demo-badge",
    emptyStandings: ".empty-standings",
    standingsWrapper: ".standings-wrapper",
    standingsHeader: ".standings-header-container",
    standingsBody: ".standings-body-container",
    standingsRows: ".standings-body-container tbody tr",
  };

  abstract getSeasonName(): Promise<string>;
  abstract getStandingsCount(): Promise<number>;
  abstract getEmptyMessage(): Promise<string>;
  abstract hasDemoBadge(): Promise<boolean>;
}
