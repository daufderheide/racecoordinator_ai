import { Locator } from '@playwright/test';
import { DefaultRacedaySetupHarnessBase } from './default-raceday-setup.harness.base';

export class DefaultRacedaySetupHarnessE2e implements DefaultRacedaySetupHarnessBase {
  constructor(private locator: Locator) {}

  private get driverItems() { return this.locator.locator('.driver-item'); }

  async clickDriverItem(): Promise<void> {
    await this.driverItems.first().click();
  }

  async doubleClickDriverItem(): Promise<void> {
    await this.driverItems.first().dblclick();
  }
}
