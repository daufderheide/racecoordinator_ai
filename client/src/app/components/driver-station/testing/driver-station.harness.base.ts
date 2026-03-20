export abstract class DriverStationHarnessBase {
  static readonly hostSelector = 'app-driver-station';

  static readonly selectors = {
    thermometer: '.thermometer-container .fill',
    fuelThermometer: '.fuel-column .thermometer-container .fill',
    dataRow: '.data-row',
    label: '.label',
    value: '.value'
  };

  abstract getDataRowCount(): Promise<number>;
  abstract getLabelText(index: number): Promise<string>;
  abstract getValueText(index: number): Promise<string>;
  abstract getThermometerFillHeight(): Promise<string | null>;
  abstract hasFuelColumn(): Promise<boolean>;
}
