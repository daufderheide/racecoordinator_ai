import {
  BaseHarnessFilters,
  ComponentHarness,
  HarnessPredicate,
} from "@angular/cdk/testing";

import { CustomSelectHarnessBase } from "./custom-select.harness.base";

export interface CustomSelectHarnessFilters extends BaseHarnessFilters {
  value?: string;
}

export class CustomSelectHarness
  extends ComponentHarness
  implements CustomSelectHarnessBase
{
  static hostSelector = CustomSelectHarnessBase.hostSelector;

  static with(
    options: CustomSelectHarnessFilters = {},
  ): HarnessPredicate<CustomSelectHarness> {
    return new HarnessPredicate(CustomSelectHarness, options);
  }

  protected getTrigger = this.locatorFor(
    CustomSelectHarnessBase.selectors.trigger,
  );
  protected getDropdown = this.locatorForOptional(
    CustomSelectHarnessBase.selectors.dropdown,
  );
  protected getOptions = this.locatorForAll(
    CustomSelectHarnessBase.selectors.option,
  );

  async isOpen(): Promise<boolean> {
    const dropdown = await this.getDropdown();
    return dropdown !== null;
  }

  async toggle(): Promise<void> {
    const trigger = await this.getTrigger();
    await trigger.click();
  }

  async getOptionsCount(): Promise<number> {
    const options = await this.getOptions();
    return options.length;
  }

  async getOptionText(index: number): Promise<string> {
    const options = await this.getOptions();
    if (index >= 0 && index < options.length) {
      return await options[index].text();
    }
    throw new Error(`Option index ${index} out of bounds.`);
  }

  async clickOption(index: number): Promise<void> {
    const options = await this.getOptions();
    if (index >= 0 && index < options.length) {
      await options[index].click();
      return;
    }
    throw new Error(`Option index ${index} out of bounds.`);
  }

  async selectOptionByValue(value: string): Promise<void> {
    const isOpen = await this.isOpen();
    if (!isOpen) {
      const trigger = await this.getTrigger();
      await trigger.click();
    }
    const optLocator = this.locatorFor(
      `${CustomSelectHarnessBase.selectors.option}[data-value='${value}']`,
    );
    const opt = await optLocator();
    await opt.click();
  }

  async getValue(): Promise<string> {
    const host = await this.host();
    return (await host.getAttribute("data-value")) || "";
  }
}
