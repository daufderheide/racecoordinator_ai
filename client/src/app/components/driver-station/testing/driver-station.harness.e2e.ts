import { Locator } from '@playwright/test';
import { DriverStationHarnessBase } from './driver-station.harness.base';

export class DriverStationHarnessE2e implements DriverStationHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return DriverStationHarnessBase; }

  private get dataRows() { return this.locator.locator(this.base.selectors.dataRow); }
  private get thermometer() { return this.locator.locator(this.base.selectors.thermometer); }
  private get fuelColumn() { return this.locator.locator('.fuel-column'); }

  async getDataRowCount(): Promise<number> {
    return await this.dataRows.count();
  }

  async getLabelText(index: number): Promise<string> {
    const row = this.dataRows.nth(index);
    return (await row.locator(this.base.selectors.label).innerText()) || '';
  }

  async getValueText(index: number): Promise<string> {
    const row = this.dataRows.nth(index);
    return (await row.locator(this.base.selectors.value).innerText()) || '';
  }

  async getThermometerFillHeight(): Promise<string | null> {
    const el = this.thermometer.first();
    if (await el.count() > 0) {
      return await el.getAttribute('style'); 
    }
    return null;
  }

  async hasFuelColumn(): Promise<boolean> {
    return await this.fuelColumn.isVisible();
  }
}
