import { Locator } from "@playwright/test";

import { SeasonResultsHarnessBase } from "./season-results.harness.base";

export class SeasonResultsHarnessE2e implements SeasonResultsHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return SeasonResultsHarnessBase;
  }

  private get standingsTable() {
    return this.locator.locator(this.base.selectors.standingsTable).first();
  }

  private get standingsRows() {
    return this.locator.locator(this.base.selectors.standingsRows);
  }

  private get racesExpanderSection() {
    return this.locator
      .locator(this.base.selectors.racesExpanderSection)
      .first();
  }

  private get expanderCards() {
    return this.locator.locator(this.base.selectors.expanderCards);
  }

  async hasStandingsTable(): Promise<boolean> {
    return await this.standingsTable.isVisible();
  }

  async getStandingsRowCount(): Promise<number> {
    return await this.standingsRows.count();
  }

  async hasRaceBreakdown(): Promise<boolean> {
    return await this.racesExpanderSection.isVisible();
  }

  async getRaceExpanderCount(): Promise<number> {
    return await this.expanderCards.count();
  }

  async toggleRaceExpander(index: number): Promise<void> {
    const card = this.expanderCards.nth(index);
    const titleBar = card.locator(this.base.selectors.expanderTitleBar).first();
    await titleBar.click();
  }

  async isRaceExpanded(index: number): Promise<boolean> {
    const card = this.expanderCards.nth(index);
    const breakdownTable = card
      .locator(this.base.selectors.raceBreakdownTable)
      .first();
    return await breakdownTable.isVisible();
  }
}
