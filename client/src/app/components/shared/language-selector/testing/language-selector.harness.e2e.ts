import { Locator } from "@playwright/test";

import { LanguageSelectorHarnessBase } from "./language-selector.harness.base";

export class LanguageSelectorHarnessE2e implements LanguageSelectorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return LanguageSelectorHarnessBase;
  }

  private get dropdown() {
    return this.locator.locator(this.base.selectors.dropdown);
  }

  async isDropdownOpen(): Promise<boolean> {
    return await this.dropdown.isVisible();
  }
}
