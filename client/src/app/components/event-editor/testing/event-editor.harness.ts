import { ComponentHarness } from "@angular/cdk/testing";

import { EventEditorHarnessBase } from "./event-editor.harness.base";

export class EventEditorHarness
  extends ComponentHarness
  implements EventEditorHarnessBase
{
  static hostSelector = EventEditorHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
