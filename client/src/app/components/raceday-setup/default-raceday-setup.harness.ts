import { ComponentHarness } from '@angular/cdk/testing';
import { DefaultRacedaySetupHarnessBase } from './default-raceday-setup.harness.base';

export class DefaultRacedaySetupHarness extends ComponentHarness implements DefaultRacedaySetupHarnessBase {
  static hostSelector = 'app-default-raceday-setup';

  protected getDriverItems = this.locatorForAll('.driver-item');

  async clickDriverItem(): Promise<void> {
    const items = await this.getDriverItems();
    if (items.length > 0) {
      await items[0].click();
    }
  }

  async doubleClickDriverItem(): Promise<void> {
    const items = await this.getDriverItems();
    if (items.length > 0) {
      await items[0].dispatchEvent('dblclick');
    }
  }
}
