import { Locator } from "@playwright/test";

import { ImageInspectorHarnessBase } from "./image-inspector.harness.base";

export class ImageInspectorHarnessE2e implements ImageInspectorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return ImageInspectorHarnessBase;
  }

  private get imagePreview() {
    return this.locator.locator(this.base.selectors.imagePreview);
  }

  private get previewImage() {
    return this.locator.locator(this.base.selectors.previewImage);
  }

  private get removeButton() {
    return this.locator.locator(this.base.selectors.removeButton);
  }

  async getImageUrl(): Promise<string> {
    if ((await this.previewImage.count()) === 0) return "";
    return (await this.previewImage.getAttribute("src")) || "";
  }

  async clickImagePreview(): Promise<void> {
    await this.imagePreview.click();
  }

  async hasRemoveButton(): Promise<boolean> {
    return (await this.removeButton.count()) > 0;
  }

  async clickRemoveButton(): Promise<void> {
    await this.removeButton.click();
  }
}
