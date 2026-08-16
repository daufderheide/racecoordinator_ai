export abstract class AssetPreviewHarnessBase {
  static readonly hostSelector = "app-asset-preview";

  static readonly selectors = {
    container: ".preview-container",
    img: ".preview-img",
    icon: ".preview-icon",
  };

  abstract getImageSrc(): Promise<string | null>;
  abstract hasIcon(): Promise<boolean>;
}
