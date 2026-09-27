import { ComponentHarness } from "@angular/cdk/testing";
import { CustomSelectHarness } from "@app/components/shared/custom-select/testing/custom-select.harness";

import { LaneViewInspectorHarnessBase } from "./lane-view-inspector.harness.base";

export class LaneViewInspectorHarness
  extends ComponentHarness
  implements LaneViewInspectorHarnessBase
{
  static hostSelector = LaneViewInspectorHarnessBase.hostSelector;

  protected getSelects = this.locatorForAll(CustomSelectHarness);

  protected getWidthInputs = this.locatorForAll(
    LaneViewInspectorHarnessBase.selectors.columnWidthInputs,
  );

  async getTimeDecimalPlaces(): Promise<number> {
    const selects = await this.getSelects();
    return Number(await selects[1].getValue());
  }

  async setTimeDecimalPlaces(val: number): Promise<void> {
    const selects = await this.getSelects();
    await selects[1].selectOptionByValue(val.toString());
  }

  async getLapDecimalPlaces(): Promise<number> {
    const selects = await this.getSelects();
    return Number(await selects[2].getValue());
  }

  async setLapDecimalPlaces(val: number): Promise<void> {
    const selects = await this.getSelects();
    await selects[2].selectOptionByValue(val.toString());
  }

  async getColumnWidth(columnIndex: number): Promise<number> {
    const inputs = await this.getWidthInputs();
    return Number(await inputs[columnIndex].getProperty("value"));
  }

  async setColumnWidth(columnIndex: number, val: number): Promise<void> {
    const inputs = await this.getWidthInputs();
    await inputs[columnIndex].clear();
    await inputs[columnIndex].sendKeys(val.toString());
    await inputs[columnIndex].dispatchEvent("input");
    await inputs[columnIndex].dispatchEvent("change");
  }
}
