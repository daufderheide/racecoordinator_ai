import { Locator } from "@playwright/test";

import { CustomSelectHarnessBase } from "./custom-select.harness.base";

export class CustomSelectHarnessE2e implements CustomSelectHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return CustomSelectHarnessBase;
  }

  private get trigger() {
    return this.locator.locator(this.base.selectors.trigger);
  }
  private get dropdown() {
    return this.locator.locator(this.base.selectors.dropdown);
  }
  private get options() {
    return this.locator.locator(this.base.selectors.option);
  }

  async isOpen(): Promise<boolean> {
    return await this.dropdown.isVisible();
  }

  async toggle(): Promise<void> {
    await this.trigger.click();
  }

  async getOptionsCount(): Promise<number> {
    return await this.options.count();
  }

  async getOptionText(index: number): Promise<string> {
    const count = await this.getOptionsCount();
    if (index >= 0 && index < count) {
      return await this.options.nth(index).innerText();
    }
    throw new Error(`Option index ${index} out of bounds.`);
  }

  async clickOption(index: number): Promise<void> {
    const count = await this.getOptionsCount();
    if (index >= 0 && index < count) {
      await this.options.nth(index).click();
      return;
    }
    throw new Error(`Option index ${index} out of bounds.`);
  }

  async selectOptionByValue(value: string): Promise<void> {
    const option = this.locator.locator(
      `${this.base.selectors.option}[data-value='${value}']`,
    );
    await option.click();
  }
}
