import { Locator } from "@playwright/test";

import { UpdateSelectorHarnessBase } from "./update-selector.harness.base";

export class UpdateSelectorHarnessE2e implements UpdateSelectorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return UpdateSelectorHarnessBase;
  }

  private get dropdown() {
    return this.locator.locator(this.base.selectors.dropdown);
  }

  async isDropdownOpen(): Promise<boolean> {
    return await this.dropdown.isVisible();
  }
}
