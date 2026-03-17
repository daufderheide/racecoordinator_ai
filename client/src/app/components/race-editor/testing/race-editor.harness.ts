import { ComponentHarness } from '@angular/cdk/testing';
import { RaceEditorHarnessBase } from './race-editor.harness.base';

export class RaceEditorHarness extends ComponentHarness implements RaceEditorHarnessBase {
  static hostSelector = RaceEditorHarnessBase.hostSelector;

  protected getNameEl = this.locatorFor(RaceEditorHarnessBase.selectors.nameInput);
  protected getDuplicateBtn = this.locatorFor(RaceEditorHarnessBase.selectors.duplicateBtn);
  protected getDriverCountEl = this.locatorFor(RaceEditorHarnessBase.selectors.driverCountInput);
  protected getRotationSelectEl = this.locatorFor(RaceEditorHarnessBase.selectors.rotationSelect);
  protected getTrackSelectEl = this.locatorFor(RaceEditorHarnessBase.selectors.trackSelect);

  async getName(): Promise<string> {
    const input = await this.getNameEl();
    return await input.getProperty('value');
  }

  async setName(name: string): Promise<void> {
    const input = await this.getNameEl();
    await input.clear();
    await input.sendKeys(name);
  }

  async clickDuplicate(): Promise<void> {
    const btn = await this.getDuplicateBtn();
    await btn.click();
    // Duplication may trigger async creates loaded internally.
  }

  async getDriverCount(): Promise<number> {
    const input = await this.getDriverCountEl();
    const val = await input.getProperty('value');
    return Number(val);
  }

  async setDriverCount(count: number): Promise<void> {
    const input = await this.getDriverCountEl();
    await input.clear();
    await input.sendKeys(String(count));
  }

  async getTrack(): Promise<string> {
    const select = await this.getTrackSelectEl();
    return await select.getProperty('value');
  }

  async setTrack(trackId: string): Promise<void> {
    const select = await this.getTrackSelectEl();
    await select.sendKeys(trackId);
  }
}
