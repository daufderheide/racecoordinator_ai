export abstract class DsEditorHarnessBase {
  static readonly hostSelector = "app-ds-editor";

  static readonly selectors = {
    container: ".arduino-config-container",
  };

  abstract exists(): Promise<boolean>;
}
