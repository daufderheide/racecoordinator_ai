export abstract class DriverResultsHarnessBase {
  static readonly hostSelector = "app-driver-results";

  static readonly selectors = {
    headerBar: ".header-bar",
    overallTable: ".results-table.overall-table",
    heatsSection: ".heats-section-container",
    expandedHeatCard: ".heat-card.expanded",
    lapsCell: ".col-laps",
    lapChartSection: ".lap-chart-section",
    gridLine: ".grid-line",
    lapBar: ".lap-bar",
    lapBarSegment: ".lap-bar-segment",
    lapBarSolid: ".lap-bar-solid",
    lapBarTooltip: ".lap-bar-tooltip",
    tooltipHeader: ".tooltip-header",
    tooltipVal: ".total-row .tooltip-val",
    teamDriverBadge: ".team-driver-badge",
    tooltipDriver: ".tooltip-row.driver-row .text-driver",
  };

  abstract hasHeaderBar(): Promise<boolean>;
  abstract hasOverallTable(): Promise<boolean>;
  abstract hasHeatsSection(): Promise<boolean>;
  abstract hasExpandedHeatCard(): Promise<boolean>;
  abstract hasLapsCell(): Promise<boolean>;
  abstract hasLapChartSection(): Promise<boolean>;
  abstract getGridLineCount(): Promise<number>;
  abstract getLapBarCount(): Promise<number>;
  abstract getTeamDriverBadgeCount(): Promise<number>;
  abstract hasTooltipDriver(): Promise<boolean>;
  abstract getTooltipDriverText(): Promise<string>;
}
