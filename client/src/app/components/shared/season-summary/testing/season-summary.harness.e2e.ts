import { Locator } from "@playwright/test";

import { SeasonSummaryHarnessBase } from "./season-summary.harness.base";

export class SeasonSummaryHarnessE2e implements SeasonSummaryHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return SeasonSummaryHarnessBase;
  }

  private get seasonNameEl() {
    return this.locator.locator(this.base.selectors.seasonName);
  }

  private get standingsRows() {
    return this.locator.locator(this.base.selectors.standingsRows);
  }

  private get emptyStandingsEl() {
    return this.locator.locator(this.base.selectors.emptyStandings);
  }

  private get demoBadgeEl() {
    return this.locator.locator(this.base.selectors.demoBadge);
  }

  async getSeasonName(): Promise<string> {
    return await this.seasonNameEl.innerText();
  }

  async getStandingsCount(): Promise<number> {
    return await this.standingsRows.count();
  }

  async getEmptyMessage(): Promise<string> {
    return await this.emptyStandingsEl.innerText();
  }

  async hasDemoBadge(): Promise<boolean> {
    return (await this.demoBadgeEl.count()) > 0;
  }
}
