export abstract class DriverManagerHarnessBase {
  static readonly hostSelector = 'app-driver-manager';

  static readonly selectors = {
    searchInput: '.search-input',
    driverRow: '.driver-table.body-only tbody tr',
    configNameInput: '.config-panel input',
    editBtn: '.btn-edit',
    deleteBtn: '.btn-delete',
    nameCell: '.name-cell',
    nicknameCell: '.nickname-cell'
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
