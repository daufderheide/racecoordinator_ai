import { ComponentHarness } from "@angular/cdk/testing";

import { LanguageSelectorHarnessBase } from "./language-selector.harness.base";

export class LanguageSelectorHarness
  extends ComponentHarness
  implements LanguageSelectorHarnessBase
{
  static hostSelector = LanguageSelectorHarnessBase.hostSelector;

  protected getDropdown = this.locatorForOptional(
    LanguageSelectorHarnessBase.selectors.dropdown,
  );

  async isDropdownOpen(): Promise<boolean> {
    const dd = await this.getDropdown();
    return dd !== null;
  }
}
