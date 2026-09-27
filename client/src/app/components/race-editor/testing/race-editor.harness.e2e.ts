import { Locator } from "@playwright/test";

import { RaceEditorHarnessBase } from "./race-editor.harness.base";

export class RaceEditorHarnessE2e implements RaceEditorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RaceEditorHarnessBase;
  }

  private get nameInput() {
    return this.locator.locator(this.base.selectors.nameInput);
  }
  private get copyBtn() {
    return this.locator.locator(this.base.selectors.copyBtn);
  }
  private get driverCountInput() {
    return this.locator.locator(this.base.selectors.driverCountInput);
  }
  private get rotationSelect() {
    return this.locator.locator(this.base.selectors.rotationSelect);
  }
  private get trackSelect() {
    return this.locator.locator(this.base.selectors.trackSelect);
  }
  private get heatTimesThroughInput() {
    return this.locator.locator(this.base.selectors.heatTimesThroughInput);
  }
  private get reverseHeatsCheckbox() {
    return this.locator.locator(this.base.selectors.reverseHeatsCheckbox);
  }

  async getName(): Promise<string> {
    return await this.nameInput.inputValue();
  }

  async setName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async clickCopy(): Promise<void> {
    await this.copyBtn.click();
  }

  async getDriverCount(): Promise<number> {
    const val = await this.driverCountInput.inputValue();
    return Number(val);
  }

  async setDriverCount(count: number): Promise<void> {
    await this.driverCountInput.fill(String(count));
  }

  async getTrack(): Promise<string> {
    const val = await this.trackSelect.getAttribute("data-value");
    return val || "";
  }

  async setTrack(trackId: string): Promise<void> {
    await this.trackSelect.click();
    await this.locator
      .locator(`.custom-select-option[data-value='${trackId}']`)
      .click();
  }

  async getHeatTimesThrough(): Promise<number> {
    const val = await this.heatTimesThroughInput.inputValue();
    return Number(val);
  }

  async setHeatTimesThrough(count: number): Promise<void> {
    await this.heatTimesThroughInput.fill(String(count));
  }

  async getReverseHeats(): Promise<boolean> {
    return await this.reverseHeatsCheckbox.isChecked();
  }

  async setReverseHeats(reverse: boolean): Promise<void> {
    await this.reverseHeatsCheckbox.setChecked(reverse);
  }
}
