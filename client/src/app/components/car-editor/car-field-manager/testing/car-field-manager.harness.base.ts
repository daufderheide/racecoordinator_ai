export abstract class CarFieldManagerHarnessBase {
  static readonly hostSelector = "app-car-field-manager";

  static readonly selectors = {
    dialog: "#car-field-modal-dialog",
    newFieldBtn: "#btn-new-car-field",
    nameInput: "#car-field-name-input",
    choicesInput: "#car-field-choices-input",
    saveBtn: "#btn-save-car-field",
    cancelBtn: "#btn-cancel-car-field",
    error: "#car-field-form-error",
    rowName: ".cfm-row .cfm-name",
    doneBtn: "#btn-done-car-field-modal",
  };

  abstract isOpen(): Promise<boolean>;
  abstract getFieldNames(): Promise<string[]>;
  abstract clickNewField(): Promise<void>;
  abstract setName(name: string): Promise<void>;
  abstract setChoices(text: string): Promise<void>;
  abstract clickSave(): Promise<void>;
  abstract getError(): Promise<string>;
  abstract clickDone(): Promise<void>;
}
