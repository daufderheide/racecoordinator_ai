export abstract class TrakmateEditorHarnessBase {
  static readonly hostSelector = "app-trakmate-editor";

  static readonly selectors = {
    container: ".trakmate-editor-container",
  };

  abstract exists(): Promise<boolean>;
}
