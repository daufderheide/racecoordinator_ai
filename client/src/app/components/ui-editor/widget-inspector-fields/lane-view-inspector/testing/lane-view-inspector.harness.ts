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

  protected getColumnDecimalsSelects = this.locatorForAll(
    CustomSelectHarness.with({ ancestor: ".col-decimals-select" }),
  );

  async getColumnDecimals(columnIndex: number): Promise<number> {
    const selects = await this.getColumnDecimalsSelects();
    return Number(await selects[columnIndex].getValue());
  }

  async setColumnDecimals(columnIndex: number, val: number): Promise<void> {
    const selects = await this.getColumnDecimalsSelects();
    await selects[columnIndex].selectOptionByValue(val.toString());
  }

  async getTimeDecimalPlaces(): Promise<number> {
    const selects = await this.getColumnDecimalsSelects();
    if (selects.length > 1) {
      return Number(await selects[1].getValue());
    }
    const allSelects = await this.getSelects();
    return Number(await allSelects[1].getValue());
  }

  async setTimeDecimalPlaces(val: number): Promise<void> {
    const selects = await this.getColumnDecimalsSelects();
    if (selects.length > 1) {
      await selects[1].selectOptionByValue(val.toString());
      return;
    }
    const allSelects = await this.getSelects();
    await allSelects[1].selectOptionByValue(val.toString());
  }

  async getLapDecimalPlaces(): Promise<number> {
    const selects = await this.getColumnDecimalsSelects();
    if (selects.length > 0) {
      return Number(await selects[0].getValue());
    }
    const allSelects = await this.getSelects();
    return Number(await allSelects[2].getValue());
  }

  async setLapDecimalPlaces(val: number): Promise<void> {
    const selects = await this.getColumnDecimalsSelects();
    if (selects.length > 0) {
      await selects[0].selectOptionByValue(val.toString());
      return;
    }
    const allSelects = await this.getSelects();
    await allSelects[2].selectOptionByValue(val.toString());
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
