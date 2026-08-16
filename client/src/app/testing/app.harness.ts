import { ComponentHarness } from "@angular/cdk/testing";

import { AppHarnessBase } from "./app.harness.base";

export class AppHarness extends ComponentHarness implements AppHarnessBase {
  static hostSelector = AppHarnessBase.hostSelector;

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }
}
