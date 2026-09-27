import { ComponentHarness } from "@angular/cdk/testing";
import { CustomSelectHarness } from "@app/components/shared/custom-select/testing/custom-select.harness";

import { PhidgetEditorHarnessBase } from "./phidget-editor.harness.base";

export class PhidgetEditorHarness
  extends ComponentHarness
  implements PhidgetEditorHarnessBase
{
  static hostSelector = PhidgetEditorHarnessBase.hostSelector;

  protected getLapPinPitBehaviorSelect = this.locatorFor(
    CustomSelectHarness.with({
      selector: PhidgetEditorHarnessBase.selectors.pitBehaviorSelect,
    }),
  );

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }

  async getLapPinPitBehavior(): Promise<number> {
    const select = await this.getLapPinPitBehaviorSelect();
    const value = (await select.getValue()) || "0";
    return Number(value);
  }

  async setLapPinPitBehavior(value: number): Promise<void> {
    const select = await this.getLapPinPitBehaviorSelect();
    await select.selectOptionByValue(value.toString());
  }
}
