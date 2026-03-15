export abstract class ImageSetEditorHarnessBase {
  abstract isVisible(): Promise<boolean>;
  abstract getTitle(): Promise<string>;
  abstract getName(): Promise<string>;
  abstract setName(name: string): Promise<void>;
  abstract getEntryCount(): Promise<number>;
  abstract clickAddEntry(): Promise<void>;
  abstract clickSave(): Promise<void>;
  abstract clickCancel(): Promise<void>;
}
