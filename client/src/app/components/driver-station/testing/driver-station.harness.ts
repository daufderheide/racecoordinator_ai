import { ComponentHarness } from '@angular/cdk/testing';
import { DriverStationHarnessBase } from './driver-station.harness.base';

export class DriverStationHarness extends ComponentHarness implements DriverStationHarnessBase {
  static hostSelector = DriverStationHarnessBase.hostSelector;

  protected getDataRows = this.locatorForAll(DriverStationHarnessBase.selectors.dataRow);
  protected getThermometer = this.locatorForAll(DriverStationHarnessBase.selectors.thermometer);
  protected getFuelColumn = this.locatorForOptional('.fuel-column');

  async getDataRowCount(): Promise<number> {
    return (await this.getDataRows()).length;
  }

  async getLabelText(index: number): Promise<string> {
    const rows = await this.getDataRows();
    if (index < rows.length) {
      const label = await rows[index].locator(DriverStationHarnessBase.selectors.label).first();
      return await label.text();
    }
    return '';
  }

  async getValueText(index: number): Promise<string> {
    const rows = await this.getDataRows();
    if (index < rows.length) {
      const value = await rows[index].locator(DriverStationHarnessBase.selectors.value).first();
      return await value.text();
    }
    return '';
  }

  async getThermometerFillHeight(): Promise<string | null> {
    const thermo = await this.getThermometer();
    if (thermo.length > 0) {
      return await thermo[0].getAttribute('style'); 
    }
    return null;
  }

  async hasFuelColumn(): Promise<boolean> {
    const col = await this.getFuelColumn();
    return col !== null;
  }
}
