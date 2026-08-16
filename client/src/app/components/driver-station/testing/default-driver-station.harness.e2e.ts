import { Locator } from "@playwright/test";

import { DefaultDriverStationHarnessBase } from "./default-driver-station.harness.base";

export class DefaultDriverStationHarnessE2e implements DefaultDriverStationHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }
}
