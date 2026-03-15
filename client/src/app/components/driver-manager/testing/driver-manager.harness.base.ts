export abstract class DriverManagerHarnessBase {
  static readonly hostSelector = 'app-driver-manager';

  static readonly selectors = {
    searchInput: '.search-input',
    driverRow: '.list-item',
    configNameInput: '.config-panel input',
    nameCell: '.name',
    nicknameCell: '.nickname'
  };

  abstract getDriverCount(): Promise<number>;
  abstract getDriverName(index: number): Promise<string>;
  abstract getDriverNickname(index: number): Promise<string>;
  abstract selectDriver(index: number): Promise<void>;
  abstract setSearchQuery(query: string): Promise<void>;
  abstract getSelectedDriverName(): Promise<string>;
  abstract clickEdit(): Promise<void>;
  abstract clickDelete(): Promise<void>;
}
