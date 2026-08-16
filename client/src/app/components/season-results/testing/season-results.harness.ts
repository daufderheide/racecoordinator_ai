import { ComponentHarness } from "@angular/cdk/testing";

import { SeasonResultsHarnessBase } from "./season-results.harness.base";

export class SeasonResultsHarness
  extends ComponentHarness
  implements SeasonResultsHarnessBase
{
  static hostSelector = SeasonResultsHarnessBase.hostSelector;

  protected getStandingsTableEl = this.locatorForOptional(
    SeasonResultsHarnessBase.selectors.standingsTable,
  );
  protected getStandingsRowsEl = this.locatorForAll(
    SeasonResultsHarnessBase.selectors.standingsRows,
  );
  protected getRacesExpanderSectionEl = this.locatorForOptional(
    SeasonResultsHarnessBase.selectors.racesExpanderSection,
  );
  protected getExpanderCardsEl = this.locatorForAll(
    SeasonResultsHarnessBase.selectors.expanderCards,
  );

  protected getExpanderTitleBarsEl = this.locatorForAll(
    SeasonResultsHarnessBase.selectors.expanderTitleBar,
  );
  protected getBreakdownTablesEl = this.locatorForAll(
    SeasonResultsHarnessBase.selectors.raceBreakdownTable,
  );

  protected getDriverExpandableRowsEl = this.locatorForAll(
    SeasonResultsHarnessBase.selectors.driverExpandableRows,
  );
  protected getDriverBonusDetailsRowsEl = this.locatorForAll(
    SeasonResultsHarnessBase.selectors.driverBonusDetailsRows,
  );

  async hasStandingsTable(): Promise<boolean> {
    return (await this.getStandingsTableEl()) !== null;
  }

  async getStandingsRowCount(): Promise<number> {
    const rows = await this.getStandingsRowsEl();
    return rows.length;
  }

  async hasRaceBreakdown(): Promise<boolean> {
    return (await this.getRacesExpanderSectionEl()) !== null;
  }

  async getRaceExpanderCount(): Promise<number> {
    const cards = await this.getExpanderCardsEl();
    return cards.length;
  }

  async toggleRaceExpander(index: number): Promise<void> {
    const bars = await this.getExpanderTitleBarsEl();
    if (bars[index]) {
      await bars[index].click();
    }
  }

  async isRaceExpanded(index: number): Promise<boolean> {
    const tables = await this.getBreakdownTablesEl();
    return index >= 0 && index < tables.length;
  }

  async toggleDriverExpander(
    _raceIndex: number,
    driverIndex: number,
  ): Promise<void> {
    const rows = await this.getDriverExpandableRowsEl();
    if (rows[driverIndex]) {
      await rows[driverIndex].click();
    }
  }

  async isDriverExpanded(
    _raceIndex: number,
    driverIndex: number,
  ): Promise<boolean> {
    const rows = await this.getDriverBonusDetailsRowsEl();
    if (driverIndex >= 0 && driverIndex < rows.length) {
      const isCollapsed = await rows[driverIndex].hasClass(
        "driver-bonus-collapsed",
      );
      return !isCollapsed;
    }
    return false;
  }
}
