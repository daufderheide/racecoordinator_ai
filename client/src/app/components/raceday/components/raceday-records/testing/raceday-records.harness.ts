import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayRecordsHarnessBase } from "./raceday-records.harness.base";

export class RacedayRecordRowHarness extends ComponentHarness {
  static hostSelector = RacedayRecordsHarnessBase.selectors.recordRow;

  protected getVals = this.locatorForAll(
    RacedayRecordsHarnessBase.selectors.recordVal,
  );

  async getValues(): Promise<{ nickname: string; score: string }> {
    const vals = await this.getVals();
    if (vals.length >= 2) {
      return {
        nickname: await vals[0].text(),
        score: await vals[1].text(),
      };
    }
    return { nickname: "", score: "" };
  }
}

export class RacedayRecordsHarness
  extends ComponentHarness
  implements RacedayRecordsHarnessBase
{
  static hostSelector = RacedayRecordsHarnessBase.hostSelector;

  protected getRows = this.locatorForAll(RacedayRecordRowHarness);

  async getRecordRowValues(
    index: number,
  ): Promise<{ nickname: string; score: string }> {
    const rows = await this.getRows();
    if (index < rows.length) {
      return await rows[index].getValues();
    }
    return { nickname: "", score: "" };
  }
}
