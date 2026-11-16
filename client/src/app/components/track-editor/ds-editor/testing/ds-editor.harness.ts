import { ComponentHarness } from "@angular/cdk/testing";

import { DsEditorHarnessBase } from "./ds-editor.harness.base";

export class DsEditorHarness
  extends ComponentHarness
  implements DsEditorHarnessBase
{
  static hostSelector = DsEditorHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
