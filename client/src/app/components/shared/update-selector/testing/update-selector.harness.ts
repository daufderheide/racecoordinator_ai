import { ComponentHarness } from "@angular/cdk/testing";

import { UpdateSelectorHarnessBase } from "./update-selector.harness.base";

export class UpdateSelectorHarness
  extends ComponentHarness
  implements UpdateSelectorHarnessBase
{
  static hostSelector = UpdateSelectorHarnessBase.hostSelector;

  protected getDropdown = this.locatorForOptional(
    UpdateSelectorHarnessBase.selectors.dropdown,
  );

  async isDropdownOpen(): Promise<boolean> {
    const dd = await this.getDropdown();
    return dd !== null;
  }
}
