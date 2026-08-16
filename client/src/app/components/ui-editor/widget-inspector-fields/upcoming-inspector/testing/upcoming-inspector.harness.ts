import { ComponentHarness } from "@angular/cdk/testing";

import { UpcomingInspectorHarnessBase } from "./upcoming-inspector.harness.base";

export class UpcomingInspectorHarness
  extends ComponentHarness
  implements UpcomingInspectorHarnessBase
{
  static hostSelector = UpcomingInspectorHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
