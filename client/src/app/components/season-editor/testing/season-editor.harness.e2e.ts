import { Locator } from "@playwright/test";

import { SeasonEditorHarnessBase } from "./season-editor.harness.base";

export class SeasonEditorHarnessE2e implements SeasonEditorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return SeasonEditorHarnessBase;
  }

  private get nameInput() {
    return this.locator.locator(this.base.selectors.nameInput);
  }

  private get dropsInput() {
    return this.locator.locator(this.base.selectors.dropsInput);
  }

  private get addRaceBtn() {
    return this.locator.locator(this.base.selectors.addRaceBtn);
  }

  private get copyBtn() {
    return this.locator.locator(this.base.selectors.copyBtn);
  }

  private get expanderCards() {
    return this.locator.locator(this.base.selectors.expanderCards);
  }

  async getName(): Promise<string> {
    return await this.nameInput.inputValue();
  }

  async setName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async getDrops(): Promise<number> {
    const val = await this.dropsInput.inputValue();
    return Number(val);
  }

  async setDrops(drops: number): Promise<void> {
    await this.dropsInput.fill(String(drops));
  }

  async clickCopy(): Promise<void> {
    await this.copyBtn.click();
  }

  async clickAddRace(): Promise<void> {
    await this.addRaceBtn.click();
  }

  async getRaceExpanderCount(): Promise<number> {
    return await this.expanderCards.count();
  }
}
