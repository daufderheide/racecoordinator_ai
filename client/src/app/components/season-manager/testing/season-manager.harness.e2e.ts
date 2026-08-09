import { Locator } from "@playwright/test";

import { SeasonManagerHarnessBase } from "./season-manager.harness.base";

export class SeasonManagerHarnessE2e implements SeasonManagerHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return SeasonManagerHarnessBase;
  }

  private get listItems() {
    return this.locator.locator(this.base.selectors.listItem);
  }

  private get searchInput() {
    return this.locator.locator(this.base.selectors.searchBarInput);
  }

  private get detailHeader() {
    return this.locator.locator(".detail-header h2");
  }

  private get standingsRows() {
    return this.locator.locator(this.base.selectors.standingsRows);
  }

  async getSeasonCount(): Promise<number> {
    return await this.listItems.count();
  }

  async selectSeason(index: number): Promise<void> {
    await this.listItems.nth(index).click();
  }

  async getSelectedSeasonName(): Promise<string> {
    return await this.detailHeader.innerText();
  }

  async searchSeasons(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async getStandingsCount(): Promise<number> {
    return await this.standingsRows.count();
  }
}
