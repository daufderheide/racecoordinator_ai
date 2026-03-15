export abstract class DatabaseManagerHarnessBase {
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
