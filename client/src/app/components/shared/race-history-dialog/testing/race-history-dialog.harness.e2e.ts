import { Locator } from "@playwright/test";

import { RaceHistoryDialogHarnessBase } from "./race-history-dialog.harness.base";

export class RaceHistoryDialogHarnessE2e implements RaceHistoryDialogHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RaceHistoryDialogHarnessBase;
  }

  private get backdrop() {
    return this.locator.locator(this.base.selectors.backdrop);
  }

  private get closeBtn() {
    return this.locator.locator(this.base.selectors.closeBtn);
  }

  private get searchInput() {
    return this.locator.locator(this.base.selectors.searchInput);
  }

  private get raceCards() {
    return this.locator.locator(this.base.selectors.raceCards);
  }

  async isVisible(): Promise<boolean> {
    return await this.backdrop.isVisible();
  }

  async dismiss(): Promise<void> {
    await this.closeBtn.click();
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async getSearchValue(): Promise<string> {
    return await this.searchInput.inputValue();
  }

  async getRaceCardCount(): Promise<number> {
    return await this.raceCards.count();
  }
}
