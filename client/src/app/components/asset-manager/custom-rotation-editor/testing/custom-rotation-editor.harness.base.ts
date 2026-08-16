export abstract class CustomRotationEditorHarnessBase {
  static readonly hostSelector = "app-custom-rotation-editor";

  static readonly selectors = {
    editorContainer: ".custom-rotation-editor",
  };

  abstract exists(): Promise<boolean>;
}
