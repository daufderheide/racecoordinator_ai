import { ComponentHarness } from "@angular/cdk/testing";

import { MenuInspectorHarnessBase } from "./menu-inspector.harness.base";

export class MenuInspectorHarness
  extends ComponentHarness
  implements MenuInspectorHarnessBase
{
  static hostSelector = MenuInspectorHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
