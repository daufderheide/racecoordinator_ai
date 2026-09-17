import { Locator } from "@playwright/test";
import { AssetLayoutMode } from "@app/models/asset";

import { AssetLayoutSwitcherHarnessBase } from "./asset-layout-switcher.harness.base";

export class AssetLayoutSwitcherHarnessE2e implements AssetLayoutSwitcherHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return AssetLayoutSwitcherHarnessBase;
  }

  private get listBtn() {
    return this.locator.locator(this.base.selectors.listBtn);
  }

  private get smallBtn() {
    return this.locator.locator(this.base.selectors.smallBtn);
  }

  private get mediumBtn() {
    return this.locator.locator(this.base.selectors.mediumBtn);
  }

  private get largeBtn() {
    return this.locator.locator(this.base.selectors.largeBtn);
  }

  async getActiveMode(): Promise<AssetLayoutMode | null> {
    const isList = await this.listBtn.evaluate((el) =>
      el.classList.contains("active"),
    );
    if (isList) return "list";
    const isSmall = await this.smallBtn.evaluate((el) =>
      el.classList.contains("active"),
    );
    if (isSmall) return "small";
    const isMedium = await this.mediumBtn.evaluate((el) =>
      el.classList.contains("active"),
    );
    if (isMedium) return "medium";
    const isLarge = await this.largeBtn.evaluate((el) =>
      el.classList.contains("active"),
    );
    if (isLarge) return "large";
    return null;
  }

  async setLayoutMode(mode: AssetLayoutMode): Promise<void> {
    switch (mode) {
      case "list":
        await this.listBtn.click();
        break;
      case "small":
        await this.smallBtn.click();
        break;
      case "medium":
        await this.mediumBtn.click();
        break;
      case "large":
        await this.largeBtn.click();
        break;
    }
  }
}
