import { Locator } from "@playwright/test";

import { WidgetInspectorFieldsHarnessBase } from "./widget-inspector-fields.harness.base";

export class WidgetInspectorFieldsHarnessE2e implements WidgetInspectorFieldsHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
