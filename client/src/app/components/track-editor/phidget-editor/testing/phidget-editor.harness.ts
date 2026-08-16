import { ComponentHarness } from "@angular/cdk/testing";

import { PhidgetEditorHarnessBase } from "./phidget-editor.harness.base";

export class PhidgetEditorHarness
  extends ComponentHarness
  implements PhidgetEditorHarnessBase
{
  static hostSelector = PhidgetEditorHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
