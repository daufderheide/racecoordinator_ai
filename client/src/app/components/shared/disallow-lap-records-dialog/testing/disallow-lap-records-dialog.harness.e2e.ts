import { Locator } from "@playwright/test";

import { DisallowLapRecordsDialogHarnessBase } from "./disallow-lap-records-dialog.harness.base";

export class DisallowLapRecordsDialogHarnessE2e implements DisallowLapRecordsDialogHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return DisallowLapRecordsDialogHarnessBase;
  }

  private get backdrop() {
    return this.locator.locator(this.base.selectors.backdrop);
  }

  private get closeBtn() {
    return this.locator.locator(this.base.selectors.closeBtn);
  }

  private get raceNameEl() {
    return this.locator.locator(this.base.selectors.raceName);
  }

  private get lapRows() {
    return this.locator.locator(this.base.selectors.lapRows);
  }

  async isVisible(): Promise<boolean> {
    return await this.backdrop.isVisible();
  }

  async dismiss(): Promise<void> {
    await this.closeBtn.click();
  }

  async getRaceName(): Promise<string> {
    return (await this.raceNameEl.textContent()) || "";
  }

  async getLapRowsCount(): Promise<number> {
    return await this.lapRows.count();
  }
}
