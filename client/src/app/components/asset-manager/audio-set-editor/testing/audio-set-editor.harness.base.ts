export abstract class AudioSetEditorHarnessBase {
  static readonly hostSelector = "app-audio-set-editor";

  static readonly selectors = {
    backdrop: ".modal-backdrop",
    title: ".modal-title",
    nameInput: ".form-input",
    saveBtn: ".btn-save",
    cancelBtn: ".btn-cancel",
  };

  abstract isVisible(): Promise<boolean>;
  abstract clickCancel(): Promise<void>;
  abstract clickSave(): Promise<void>;
}
