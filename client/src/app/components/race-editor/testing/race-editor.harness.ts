import { ComponentHarness } from "@angular/cdk/testing";

import { RaceEditorHarnessBase } from "./race-editor.harness.base";

export class RaceEditorHarness
  extends ComponentHarness
  implements RaceEditorHarnessBase
{
  static hostSelector = RaceEditorHarnessBase.hostSelector;

  protected getNameEl = this.locatorFor(
    RaceEditorHarnessBase.selectors.nameInput,
  );
  protected getCopyBtn = this.locatorFor(
    RaceEditorHarnessBase.selectors.copyBtn,
  );
  protected getDriverCountEl = this.locatorFor(
    RaceEditorHarnessBase.selectors.driverCountInput,
  );
  protected getRotationSelectEl = this.locatorFor(
    RaceEditorHarnessBase.selectors.rotationSelect,
  );
  protected getTrackSelectEl = this.locatorFor(
    RaceEditorHarnessBase.selectors.trackSelect,
  );
  protected getHeatTimesThroughEl = this.locatorFor(
    RaceEditorHarnessBase.selectors.heatTimesThroughInput,
  );
  protected getReverseHeatsEl = this.locatorFor(
    RaceEditorHarnessBase.selectors.reverseHeatsCheckbox,
  );

  async getName(): Promise<string> {
    const input = await this.getNameEl();
    return await input.getProperty("value");
  }

  async setName(name: string): Promise<void> {
    const input = await this.getNameEl();
    await input.clear();
    await input.sendKeys(name);
  }

  async clickCopy(): Promise<void> {
    const btn = await this.getCopyBtn();
    await btn.click();
    // Duplication may trigger async creates loaded internally.
  }

  async getDriverCount(): Promise<number> {
    const input = await this.getDriverCountEl();
    const val = await input.getProperty("value");
    return Number(val);
  }

  async setDriverCount(count: number): Promise<void> {
    const input = await this.getDriverCountEl();
    await input.clear();
    await input.sendKeys(String(count));
  }

  async getTrack(): Promise<string> {
    const select = await this.getTrackSelectEl();
    return await select.getProperty("value");
  }

  async setTrack(trackId: string): Promise<void> {
    const select = await this.getTrackSelectEl();
    await select.sendKeys(trackId);
  }

  async getHeatTimesThrough(): Promise<number> {
    const input = await this.getHeatTimesThroughEl();
    const val = await input.getProperty("value");
    return Number(val);
  }

  async setHeatTimesThrough(count: number): Promise<void> {
    const input = await this.getHeatTimesThroughEl();
    await input.setInputValue(String(count));
    await input.dispatchEvent("input");
  }

  async getReverseHeats(): Promise<boolean> {
    const input = await this.getReverseHeatsEl();
    return await input.getProperty("checked");
  }

  async setReverseHeats(reverse: boolean): Promise<void> {
    const input = await this.getReverseHeatsEl();
    const current = await input.getProperty("checked");
    if (current !== reverse) {
      await input.click();
    }
  }
}
