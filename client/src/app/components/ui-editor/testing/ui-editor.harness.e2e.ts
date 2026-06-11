import { Locator } from "@playwright/test";

import { UIEditorHarnessBase } from "./ui-editor.harness.base";

export class UIEditorHarnessE2e implements UIEditorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return UIEditorHarnessBase;
  }

  private get imageSelectors() {
    return this.locator.locator(this.base.selectors.imageSelector);
  }

  async clickImageSelector(index: number): Promise<void> {
    const selector = this.imageSelectors.nth(index);
    await selector.locator(this.base.selectors.imagePreview).click();
  }
}
