export abstract class ImageSetEditorHarnessBase {
  static readonly hostSelector = 'app-image-set-editor';

  static readonly selectors = {
    backdrop: '.modal-backdrop',
    title: '.modal-title',
    nameInput: '.form-input',
    entry: '.entry-item',
    addBtn: '.btn-add',
    saveBtn: '.btn-save',
    cancelBtn: '.btn-cancel'
  };

  abstract isVisible(): Promise<boolean>;
  abstract getTitle(): Promise<string>;
  abstract getName(): Promise<string>;
  abstract setName(name: string): Promise<void>;
  abstract getEntryCount(): Promise<number>;
  abstract clickAddEntry(): Promise<void>;
  abstract clickSave(): Promise<void>;
  abstract clickCancel(): Promise<void>;
}
