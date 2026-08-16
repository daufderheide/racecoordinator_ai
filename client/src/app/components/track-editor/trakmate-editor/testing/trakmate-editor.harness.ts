import { ComponentHarness } from "@angular/cdk/testing";

import { TrakmateEditorHarnessBase } from "./trakmate-editor.harness.base";

export class TrakmateEditorHarness
  extends ComponentHarness
  implements TrakmateEditorHarnessBase
{
  static hostSelector = TrakmateEditorHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
