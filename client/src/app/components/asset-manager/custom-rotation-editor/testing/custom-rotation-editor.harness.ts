import { ComponentHarness } from "@angular/cdk/testing";

import { CustomRotationEditorHarnessBase } from "./custom-rotation-editor.harness.base";

export class CustomRotationEditorHarness
  extends ComponentHarness
  implements CustomRotationEditorHarnessBase
{
  static hostSelector = CustomRotationEditorHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
