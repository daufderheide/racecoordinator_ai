import { ComponentHarness } from "@angular/cdk/testing";

import { CarFieldManagerHarnessBase } from "./car-field-manager.harness.base";

export class CarFieldManagerHarness
  extends ComponentHarness
  implements CarFieldManagerHarnessBase
{
  static hostSelector = CarFieldManagerHarnessBase.hostSelector;

  private readonly s = CarFieldManagerHarnessBase.selectors;

  protected dialog = this.locatorForOptional(this.s.dialog);
  protected newFieldBtn = this.locatorFor(this.s.newFieldBtn);
  protected nameInput = this.locatorFor(this.s.nameInput);
  protected choicesInput = this.locatorFor(this.s.choicesInput);
  protected saveBtn = this.locatorFor(this.s.saveBtn);
  protected error = this.locatorForOptional(this.s.error);
  protected rowNames = this.locatorForAll(this.s.rowName);
  protected doneBtn = this.locatorFor(this.s.doneBtn);

  async isOpen(): Promise<boolean> {
    return (await this.dialog()) !== null;
  }

  async getFieldNames(): Promise<string[]> {
    const rows = await this.rowNames();
    return Promise.all(rows.map((r) => r.text()));
  }

  async clickNewField(): Promise<void> {
    await (await this.newFieldBtn()).click();
  }

  async setName(name: string): Promise<void> {
    const input = await this.nameInput();
    await input.clear();
    await input.sendKeys(name);
  }

  async setChoices(text: string): Promise<void> {
    const input = await this.choicesInput();
    await input.clear();
    await input.setInputValue(text);
    await input.dispatchEvent("input");
  }

  async clickSave(): Promise<void> {
    await (await this.saveBtn()).click();
  }

  async getError(): Promise<string> {
    const el = await this.error();
    return el ? (await el.text()).trim() : "";
  }

  async clickDone(): Promise<void> {
    await (await this.doneBtn()).click();
  }
}
