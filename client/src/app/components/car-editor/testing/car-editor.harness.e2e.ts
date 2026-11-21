import { Locator } from "@playwright/test";

import { CarEditorHarnessBase } from "./car-editor.harness.base";

export class CarEditorHarnessE2e implements CarEditorHarnessBase {
  constructor(private locator: Locator) {}

  private el(selector: string): Locator {
    return this.locator.locator(selector);
  }

  private get s() {
    return CarEditorHarnessBase.selectors;
  }

  async getName(): Promise<string> {
    return this.el(this.s.nameInput).inputValue();
  }

  async setName(name: string): Promise<void> {
    await this.el(this.s.nameInput).fill(name);
  }

  async getBrand(): Promise<string> {
    return this.el(this.s.brandInput).inputValue();
  }

  async setBrand(brand: string): Promise<void> {
    await this.el(this.s.brandInput).fill(brand);
  }

  async getCarClass(): Promise<string> {
    return this.el(this.s.classInput).inputValue();
  }

  async setCarClass(cls: string): Promise<void> {
    await this.el(this.s.classInput).fill(cls);
  }

  async getMotor(): Promise<string> {
    return this.el(this.s.motorInput).inputValue();
  }

  async setMotor(motor: string): Promise<void> {
    await this.el(this.s.motorInput).fill(motor);
  }

  async getNotes(): Promise<string> {
    return this.el(this.s.notesInput).inputValue();
  }

  async isModified(): Promise<boolean> {
    return this.el(this.s.modifiedInput).isChecked();
  }

  async toggleModified(): Promise<void> {
    await this.el(this.s.modifiedToggle).click();
  }

  async getClassSuggestions(): Promise<string[]> {
    const options = this.el(this.s.classOptions);
    const count = await options.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      values.push((await options.nth(i).getAttribute("value")) || "");
    }
    return values;
  }

  async isNameEditable(): Promise<boolean> {
    return this.el(this.s.nameInput).isEnabled();
  }
}
