export abstract class TeamEditorHarnessBase {
  abstract getName(): Promise<string>;
  abstract setName(name: string): Promise<void>;
  abstract clickSave(): Promise<void>;
  abstract clickSaveAsNew(): Promise<void>;
  abstract getDriverCount(): Promise<number>;
  abstract getDriverName(index: number): Promise<string>;
  abstract isDriverSelected(index: number): Promise<boolean>;
  abstract toggleDriver(index: number): Promise<void>;
  abstract clickAvatar(): Promise<void>;
  abstract isSaveEnabled(): Promise<boolean>;
}

