export abstract class PhidgetEditorHarnessBase {
  static readonly hostSelector = "app-phidget-editor";

  static readonly selectors = {
    container: ".phidget-editor-container",
  };

  abstract exists(): Promise<boolean>;
}
