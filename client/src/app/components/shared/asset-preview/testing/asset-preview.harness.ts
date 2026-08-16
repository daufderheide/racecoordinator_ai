import { ComponentHarness } from "@angular/cdk/testing";

import { AssetPreviewHarnessBase } from "./asset-preview.harness.base";

export class AssetPreviewHarness
  extends ComponentHarness
  implements AssetPreviewHarnessBase
{
  static hostSelector = AssetPreviewHarnessBase.hostSelector;

  protected getImg = this.locatorForOptional(
    AssetPreviewHarnessBase.selectors.img,
  );
  protected getIcon = this.locatorForOptional(
    AssetPreviewHarnessBase.selectors.icon,
  );

  async getImageSrc(): Promise<string | null> {
    const img = await this.getImg();
    return img ? await img.getAttribute("src") : null;
  }

  async hasIcon(): Promise<boolean> {
    const icon = await this.getIcon();
    return icon !== null;
  }
}
