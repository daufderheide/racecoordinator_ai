import { Locator } from "@playwright/test";

import { CarFieldManagerHarnessBase } from "./car-field-manager.harness.base";

export class CarFieldManagerHarnessE2e implements CarFieldManagerHarnessBase {
  constructor(private locator: Locator) {}

  private el(selector: string): Locator {
    return this.locator.locator(selector);
  }

  private get s() {
    return CarFieldManagerHarnessBase.selectors;
  }

  async isOpen(): Promise<boolean> {
    return (await this.el(this.s.dialog).count()) > 0;
  }

  async getFieldNames(): Promise<string[]> {
    return this.el(this.s.rowName).allInnerTexts();
  }

  async clickNewField(): Promise<void> {
    await this.el(this.s.newFieldBtn).click();
  }

  async setName(name: string): Promise<void> {
    await this.el(this.s.nameInput).fill(name);
  }

  async setChoices(text: string): Promise<void> {
    await this.el(this.s.choicesInput).fill(text);
  }

  async clickSave(): Promise<void> {
    await this.el(this.s.saveBtn).click();
  }

  async getError(): Promise<string> {
    const error = this.el(this.s.error);
    return (await error.count()) > 0 ? (await error.innerText()).trim() : "";
  }

  async clickDone(): Promise<void> {
    await this.el(this.s.doneBtn).click();
  }
}
