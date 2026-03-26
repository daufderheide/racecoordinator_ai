import { Locator } from '@playwright/test';
import { RaceEditorHarnessBase } from './race-editor.harness.base';

export class RaceEditorHarnessE2e implements RaceEditorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return RaceEditorHarnessBase; }

  private get nameInput() { return this.locator.locator(this.base.selectors.nameInput); }
  private get copyBtn() { return this.locator.locator(this.base.selectors.copyBtn); }
  private get driverCountInput() { return this.locator.locator(this.base.selectors.driverCountInput); }
  private get rotationSelect() { return this.locator.locator(this.base.selectors.rotationSelect); }
  private get trackSelect() { return this.locator.locator(this.base.selectors.trackSelect); }

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
    return await this.trackSelect.inputValue();
  }

  async setTrack(trackId: string): Promise<void> {
    await this.trackSelect.selectOption(trackId);
  }
}
