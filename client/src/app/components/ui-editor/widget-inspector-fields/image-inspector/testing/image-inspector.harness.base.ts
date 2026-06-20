export abstract class ImageInspectorHarnessBase {
  static readonly hostSelector = "app-image-inspector";

  static readonly selectors = {
    imagePreview: ".image-preview",
    previewImage: ".preview-img",
    removeButton: ".remove-button",
  };

  abstract getImageUrl(): Promise<string>;
  abstract clickImagePreview(): Promise<void>;
  abstract hasRemoveButton(): Promise<boolean>;
  abstract clickRemoveButton(): Promise<void>;
}
