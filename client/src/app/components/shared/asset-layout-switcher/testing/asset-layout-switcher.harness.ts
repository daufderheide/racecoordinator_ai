import { ComponentHarness } from "@angular/cdk/testing";
import { AssetLayoutMode } from "@app/models/asset";

import { AssetLayoutSwitcherHarnessBase } from "./asset-layout-switcher.harness.base";

export class AssetLayoutSwitcherHarness
  extends ComponentHarness
  implements AssetLayoutSwitcherHarnessBase
{
  static hostSelector = AssetLayoutSwitcherHarnessBase.hostSelector;

  protected getListBtn = this.locatorFor(
    AssetLayoutSwitcherHarnessBase.selectors.listBtn,
  );
  protected getSmallBtn = this.locatorFor(
    AssetLayoutSwitcherHarnessBase.selectors.smallBtn,
  );
  protected getMediumBtn = this.locatorFor(
    AssetLayoutSwitcherHarnessBase.selectors.mediumBtn,
  );
  protected getLargeBtn = this.locatorFor(
    AssetLayoutSwitcherHarnessBase.selectors.largeBtn,
  );

  async getActiveMode(): Promise<AssetLayoutMode | null> {
    const list = await this.getListBtn();
    if (await list.hasClass("active")) return "list";
    const small = await this.getSmallBtn();
    if (await small.hasClass("active")) return "small";
    const medium = await this.getMediumBtn();
    if (await medium.hasClass("active")) return "medium";
    const large = await this.getLargeBtn();
    if (await large.hasClass("active")) return "large";
    return null;
  }

  async setLayoutMode(mode: AssetLayoutMode): Promise<void> {
    switch (mode) {
      case "list":
        await (await this.getListBtn()).click();
        break;
      case "small":
        await (await this.getSmallBtn()).click();
        break;
      case "medium":
        await (await this.getMediumBtn()).click();
        break;
      case "large":
        await (await this.getLargeBtn()).click();
        break;
    }
  }
}
