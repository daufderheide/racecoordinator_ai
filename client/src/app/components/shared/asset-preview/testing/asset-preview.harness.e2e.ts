import { Locator } from "@playwright/test";

import { AssetPreviewHarnessBase } from "./asset-preview.harness.base";

export class AssetPreviewHarnessE2e implements AssetPreviewHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return AssetPreviewHarnessBase;
  }

  private get img() {
    return this.locator.locator(this.base.selectors.img);
  }

  private get icon() {
    return this.locator.locator(this.base.selectors.icon);
  }

  async getImageSrc(): Promise<string | null> {
    return await this.img.getAttribute("src");
  }

  async hasIcon(): Promise<boolean> {
    return await this.icon.isVisible();
  }
}
