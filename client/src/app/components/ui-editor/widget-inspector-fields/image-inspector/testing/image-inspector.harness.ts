import { ComponentHarness } from "@angular/cdk/testing";

import { ImageInspectorHarnessBase } from "./image-inspector.harness.base";

export class ImageInspectorHarness
  extends ComponentHarness
  implements ImageInspectorHarnessBase
{
  static hostSelector = ImageInspectorHarnessBase.hostSelector;

  protected getImagePreviewLocator = this.locatorFor(
    ImageInspectorHarnessBase.selectors.imagePreview,
  );
  protected getPreviewImageLocator = this.locatorForOptional(
    ImageInspectorHarnessBase.selectors.previewImage,
  );
  protected getRemoveButtonLocator = this.locatorForOptional(
    ImageInspectorHarnessBase.selectors.removeButton,
  );

  async getImageUrl(): Promise<string> {
    const img = await this.getPreviewImageLocator();
    if (!img) return "";
    return (await img.getAttribute("src")) || "";
  }

  async clickImagePreview(): Promise<void> {
    const preview = await this.getImagePreviewLocator();
    await preview.click();
  }

  async hasRemoveButton(): Promise<boolean> {
    const btn = await this.getRemoveButtonLocator();
    return !!btn;
  }

  async clickRemoveButton(): Promise<void> {
    const btn = await this.getRemoveButtonLocator();
    if (btn) {
      await btn.click();
    }
  }
}
