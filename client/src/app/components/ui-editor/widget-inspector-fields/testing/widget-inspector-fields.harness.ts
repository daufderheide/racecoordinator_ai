import { ComponentHarness } from "@angular/cdk/testing";

import { WidgetInspectorFieldsHarnessBase } from "./widget-inspector-fields.harness.base";

export class WidgetInspectorFieldsHarness
  extends ComponentHarness
  implements WidgetInspectorFieldsHarnessBase
{
  static hostSelector = WidgetInspectorFieldsHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
