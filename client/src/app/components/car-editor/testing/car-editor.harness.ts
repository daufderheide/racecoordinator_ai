import { ComponentHarness } from "@angular/cdk/testing";

import { CarEditorHarnessBase } from "./car-editor.harness.base";

export class CarEditorHarness
  extends ComponentHarness
  implements CarEditorHarnessBase
{
  static hostSelector = CarEditorHarnessBase.hostSelector;

  private readonly s = CarEditorHarnessBase.selectors;

  protected nameInput = this.locatorFor(this.s.nameInput);
  protected brandInput = this.locatorFor(this.s.brandInput);
  protected classInput = this.locatorFor(this.s.classInput);
  protected motorInput = this.locatorFor(this.s.motorInput);
  protected notesInput = this.locatorFor(this.s.notesInput);
  protected modifiedInput = this.locatorFor(this.s.modifiedInput);
  protected classOptions = this.locatorForAll(this.s.classOptions);

  async getName(): Promise<string> {
    return (await this.nameInput()).getProperty("value");
  }

  async setName(name: string): Promise<void> {
    const input = await this.nameInput();
    await input.clear();
    await input.sendKeys(name);
  }

  async getBrand(): Promise<string> {
    return (await this.brandInput()).getProperty("value");
  }

  async setBrand(brand: string): Promise<void> {
    const input = await this.brandInput();
    await input.clear();
    await input.sendKeys(brand);
  }

  async getCarClass(): Promise<string> {
    return (await this.classInput()).getProperty("value");
  }

  async setCarClass(cls: string): Promise<void> {
    const input = await this.classInput();
    await input.clear();
    await input.sendKeys(cls);
  }

  async getMotor(): Promise<string> {
    return (await this.motorInput()).getProperty("value");
  }

  async setMotor(motor: string): Promise<void> {
    const input = await this.motorInput();
    await input.clear();
    await input.sendKeys(motor);
  }

  async getNotes(): Promise<string> {
    return (await this.notesInput()).getProperty("value");
  }

  async isModified(): Promise<boolean> {
    return (await this.modifiedInput()).getProperty("checked");
  }

  async toggleModified(): Promise<void> {
    await (await this.modifiedInput()).click();
  }

  async getClassSuggestions(): Promise<string[]> {
    const options = await this.classOptions();
    return Promise.all(options.map((o) => o.getProperty<string>("value")));
  }

  async isNameEditable(): Promise<boolean> {
    return !(await (await this.nameInput()).getProperty("disabled"));
  }
}
