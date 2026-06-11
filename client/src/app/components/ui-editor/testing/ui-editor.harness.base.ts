export abstract class UIEditorHarnessBase {
  static readonly hostSelector = "app-ui-editor";

  static readonly selectors = {
    imageSelector: "app-image-selector",
    imagePreview: ".image-preview",
  };

  abstract clickImageSelector(index: number): Promise<void>;
}
