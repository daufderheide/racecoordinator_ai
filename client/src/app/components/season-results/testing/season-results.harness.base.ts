export abstract class SeasonResultsHarnessBase {
  static readonly hostSelector = "app-season-results";

  static readonly selectors = {
    dashboardWrapper: ".dashboard-wrapper",
    headerBar: ".header-bar",
    pageTitle: ".page-title",
    raceNameContainer: ".race-name-container",
    resultsContainer: ".results-container",
    panelHeader: ".panel-header",
    standingsTable: ".summary-section .standings-table",
    standingsRows: ".summary-section .standings-table tbody tr",
    racesExpanderSection: ".races-expander-section",
    expanderCards: ".race-expander-card",
    expanderTitleBar: ".expander-title-bar",
    raceBreakdownTable: ".race-breakdown-table",
    driverExpandableRows:
      ".race-breakdown-table tbody tr.driver-expandable-row",
    driverBonusDetailsRows:
      ".race-breakdown-table tbody tr.driver-bonus-details-row",
    bonusBreakdownCards: ".bonus-breakdown-card",
    emptyStandings: ".empty-standings",
  };

  abstract hasStandingsTable(): Promise<boolean>;
  abstract getStandingsRowCount(): Promise<number>;
  abstract hasRaceBreakdown(): Promise<boolean>;
  abstract getRaceExpanderCount(): Promise<number>;
  abstract toggleRaceExpander(index: number): Promise<void>;
  abstract isRaceExpanded(index: number): Promise<boolean>;
  abstract toggleDriverExpander(
    raceIndex: number,
    driverIndex: number,
  ): Promise<void>;
  abstract isDriverExpanded(
    raceIndex: number,
    driverIndex: number,
  ): Promise<boolean>;
}
