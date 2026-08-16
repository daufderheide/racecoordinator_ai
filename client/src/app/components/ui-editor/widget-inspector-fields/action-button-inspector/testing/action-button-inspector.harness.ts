import { ComponentHarness } from "@angular/cdk/testing";

import { ActionButtonInspectorHarnessBase } from "./action-button-inspector.harness.base";

export class ActionButtonInspectorHarness
  extends ComponentHarness
  implements ActionButtonInspectorHarnessBase
{
  static hostSelector = ActionButtonInspectorHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
