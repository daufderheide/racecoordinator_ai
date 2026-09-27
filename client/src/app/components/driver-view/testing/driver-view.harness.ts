import { ComponentHarness } from "@angular/cdk/testing";

import { DriverViewHarnessBase } from "./driver-view.harness.base";

export class DriverViewHarness
  extends ComponentHarness
  implements DriverViewHarnessBase
{
  static hostSelector = DriverViewHarnessBase.hostSelector;

  protected getDriverStation = this.locatorForOptional(
    DriverViewHarnessBase.selectors.driverStation,
  );
  protected getOnDeckContainer = this.locatorForOptional(
    DriverViewHarnessBase.selectors.onDeckContainer,
  );

  async exists(): Promise<boolean> {
    return (await this.host()) !== null;
  }

  async isRacingMode(): Promise<boolean> {
    return (await this.getDriverStation()) !== null;
  }

  async isOnDeckMode(): Promise<boolean> {
    return (await this.getOnDeckContainer()) !== null;
  }
}
