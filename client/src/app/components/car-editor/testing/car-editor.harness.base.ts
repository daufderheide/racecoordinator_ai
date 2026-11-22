export abstract class CarEditorHarnessBase {
  static readonly hostSelector = "app-car-editor";

  static readonly selectors = {
    nameInput: "#car-name-input",
    brandInput: "#car-brand-input",
    classInput: "#car-class-input",
    scaleSelect: "#car-scale-select",
    motorInput: "#car-motor-input",
    tyresInput: "#car-tyres-input",
    modifiedInput: "#car-modified-input",
    modifiedToggle: "#car-modified-toggle",
    notesInput: "#car-notes-input",
    classOptions: "#car-class-options option",
  };

  abstract getName(): Promise<string>;
  abstract setName(name: string): Promise<void>;
  abstract getBrand(): Promise<string>;
  abstract setBrand(brand: string): Promise<void>;
  abstract getCarClass(): Promise<string>;
  abstract setCarClass(cls: string): Promise<void>;
  abstract getMotor(): Promise<string>;
  abstract setMotor(motor: string): Promise<void>;
  abstract getNotes(): Promise<string>;
  abstract isModified(): Promise<boolean>;
  abstract toggleModified(): Promise<void>;
  abstract getClassSuggestions(): Promise<string[]>;
  abstract isNameEditable(): Promise<boolean>;
}
