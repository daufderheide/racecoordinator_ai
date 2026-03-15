export abstract class DefaultRacedayHarnessBase {
  static readonly hostSelector = 'app-default-raceday';

  static readonly selectors = {
    driverRow: '.driver-row',
    menuButton: '.menu-button-top',
    menuItem: '.menu-item',
    headerText: '.table-headers text'
  };

  abstract getDriverRowCount(): Promise<number>;
  abstract getDriverRowText(index: number): Promise<string>;
  abstract clickMenuButton(name: string): Promise<void>;
  abstract clickMenuItem(name: string): Promise<void>;
  abstract isHeaderColumnVisible(text: string): Promise<boolean>;
}
