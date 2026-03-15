export abstract class DatabaseManagerHarnessBase {
  static readonly hostSelector = 'app-database-manager';

  static readonly selectors = {
    listItem: '.list-item',
    itemName: '.item-name',
    detailHeader: '.detail-header h2',
    modalBackdrop: '.modal-backdrop',
    modalTitle: '.modal-title',
    input: 'input',
    btnConfirm: '.btn-confirm',
    errorMsg: '.error-msg',
    createBtn: 'button:has-text("CREATE")',
    importBtn: 'button:has-text("IMPORT")',
    useBtn: 'button:has-text("USE")'
  };

  abstract getDatabaseCount(): Promise<number>;
  abstract getDatabaseName(index: number): Promise<string>;
  abstract selectDatabase(index: number): Promise<void>;
  abstract getSelectedDatabaseName(): Promise<string | null>;
  abstract clickCreateDatabase(): Promise<void>;
  abstract clickImportDatabase(): Promise<void>;
  abstract clickUseDatabase(): Promise<void>;
  abstract isUseDatabaseEnabled(): Promise<boolean>;

  abstract isInputModalVisible(): Promise<boolean>;
  abstract getInputModalTitle(): Promise<string>;
  abstract setInputModalValue(value: string): Promise<void>;
  abstract clickInputModalConfirm(): Promise<void>;
  abstract isInputModalConfirmEnabled(): Promise<boolean>;
  abstract isInputModalErrorVisible(): Promise<boolean>;
}
