import { ComponentHarness } from "@angular/cdk/testing";

import { PhidgetEditorHarnessBase } from "./phidget-editor.harness.base";

export class PhidgetEditorHarness
  extends ComponentHarness
  implements PhidgetEditorHarnessBase
{
  static hostSelector = PhidgetEditorHarnessBase.hostSelector;

  protected getLapPinPitBehaviorSelect = this.locatorFor(
    PhidgetEditorHarnessBase.selectors.pitBehaviorSelect,
  );

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }

  async getLapPinPitBehavior(): Promise<number> {
    const select = await this.getLapPinPitBehaviorSelect();
    const value = await select.getProperty("value");
    return Number(value);
  }

  async setLapPinPitBehavior(value: number): Promise<void> {
    const select = await this.getLapPinPitBehaviorSelect();
    await select.selectOptions(value);
  }
}
