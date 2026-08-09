import { ComponentHarness } from "@angular/cdk/testing";

import { SeasonManagerHarnessBase } from "./season-manager.harness.base";

export class SeasonManagerHarness
  extends ComponentHarness
  implements SeasonManagerHarnessBase
{
  static hostSelector = SeasonManagerHarnessBase.hostSelector;

  protected getListItems = this.locatorForAll(
    SeasonManagerHarnessBase.selectors.listItem,
  );
  protected getSearchInput = this.locatorFor(
    SeasonManagerHarnessBase.selectors.searchBarInput,
  );
  protected getDetailHeader = this.locatorFor(".detail-header h2");
  protected getStandingsRows = this.locatorForAll(
    SeasonManagerHarnessBase.selectors.standingsRows,
  );

  async getSeasonCount(): Promise<number> {
    const items = await this.getListItems();
    return items.length;
  }

  async selectSeason(index: number): Promise<void> {
    const items = await this.getListItems();
    if (items[index]) {
      await items[index].click();
    }
  }

  async getSelectedSeasonName(): Promise<string> {
    const header = await this.getDetailHeader();
    return await header.text();
  }

  async searchSeasons(query: string): Promise<void> {
    const input = await this.getSearchInput();
    await input.clear();
    await input.sendKeys(query);
  }

  async getStandingsCount(): Promise<number> {
    const rows = await this.getStandingsRows();
    return rows.length;
  }
}
