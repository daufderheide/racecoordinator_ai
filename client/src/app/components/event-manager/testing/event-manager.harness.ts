import { ComponentHarness } from "@angular/cdk/testing";

import { EventManagerHarnessBase } from "./event-manager.harness.base";

export class EventManagerHarness
  extends ComponentHarness
  implements EventManagerHarnessBase
{
  static hostSelector = EventManagerHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
