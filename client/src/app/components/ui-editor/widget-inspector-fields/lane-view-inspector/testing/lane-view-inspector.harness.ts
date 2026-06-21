import { ComponentHarness } from "@angular/cdk/testing";

import { LaneViewInspectorHarnessBase } from "./lane-view-inspector.harness.base";

export class LaneViewInspectorHarness
  extends ComponentHarness
  implements LaneViewInspectorHarnessBase
{
  static hostSelector = LaneViewInspectorHarnessBase.hostSelector;

  protected getSelects = this.locatorForAll(
    LaneViewInspectorHarnessBase.selectors.selects,
  );

  async getTimeDecimalPlaces(): Promise<number> {
    const selects = await this.getSelects();
    return Number(await selects[0].getProperty("value"));
  }

  async setTimeDecimalPlaces(val: number): Promise<void> {
    const selects = await this.getSelects();
    await selects[0].sendKeys(val.toString());
    await selects[0].dispatchEvent("change");
  }

  async getLapDecimalPlaces(): Promise<number> {
    const selects = await this.getSelects();
    return Number(await selects[1].getProperty("value"));
  }

  async setLapDecimalPlaces(val: number): Promise<void> {
    const selects = await this.getSelects();
    await selects[1].sendKeys(val.toString());
    await selects[1].dispatchEvent("change");
  }
}
