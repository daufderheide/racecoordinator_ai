import { Locator } from "@playwright/test";

import { DriverViewHarnessBase } from "./driver-view.harness.base";

export class DriverViewHarnessE2e implements DriverViewHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return DriverViewHarnessBase;
  }

  private get driverStation() {
    return this.locator.locator(this.base.selectors.driverStation);
  }

  private get onDeckContainer() {
    return this.locator.locator(this.base.selectors.onDeckContainer);
  }

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }

  async isRacingMode(): Promise<boolean> {
    return await this.driverStation.isVisible();
  }

  async isOnDeckMode(): Promise<boolean> {
    return await this.onDeckContainer.isVisible();
  }
}
