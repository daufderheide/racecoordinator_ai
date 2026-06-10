import { Locator } from "@playwright/test";

import { RacedayRecordsHarnessBase } from "./raceday-records.harness.base";

export class RacedayRecordsHarnessE2e implements RacedayRecordsHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayRecordsHarnessBase;
  }

  private get recordRows() {
    return this.locator.locator(this.base.selectors.recordRow);
  }

  async getRecordRowValues(
    index: number,
  ): Promise<{ nickname: string; score: string }> {
    const row = this.recordRows.nth(index);
    const vals = row.locator(this.base.selectors.recordVal);
    if ((await vals.count()) >= 2) {
      return {
        nickname: await vals.nth(0).innerText(),
        score: await vals.nth(1).innerText(),
      };
    }
    return { nickname: "", score: "" };
  }
}
