import { ComponentHarness } from "@angular/cdk/testing";

import { RaceHistoryDialogHarnessBase } from "./race-history-dialog.harness.base";

export class RaceHistoryDialogHarness
  extends ComponentHarness
  implements RaceHistoryDialogHarnessBase
{
  static hostSelector = RaceHistoryDialogHarnessBase.hostSelector;

  protected getBackdrop = this.locatorForOptional(
    RaceHistoryDialogHarnessBase.selectors.backdrop,
  );
  protected getCloseBtn = this.locatorForOptional(
    RaceHistoryDialogHarnessBase.selectors.closeBtn,
  );
  protected getSearchInput = this.locatorForOptional(
    RaceHistoryDialogHarnessBase.selectors.searchInput,
  );
  protected getRaceCards = this.locatorForAll(
    RaceHistoryDialogHarnessBase.selectors.raceCards,
  );

  async isVisible(): Promise<boolean> {
    const backdrop = await this.getBackdrop();
    return backdrop !== null;
  }

  async dismiss(): Promise<void> {
    const btn = await this.getCloseBtn();
    if (btn) {
      await btn.click();
    }
  }

  async search(query: string): Promise<void> {
    const input = await this.getSearchInput();
    if (input) {
      await input.clear();
      if (query) {
        await input.sendKeys(query);
      }
    }
  }

  async getSearchValue(): Promise<string> {
    const input = await this.getSearchInput();
    return input ? await input.getProperty("value") : "";
  }

  async getRaceCardCount(): Promise<number> {
    const cards = await this.getRaceCards();
    return cards.length;
  }
}
