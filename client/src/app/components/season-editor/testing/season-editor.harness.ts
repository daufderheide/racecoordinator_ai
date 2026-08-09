import { ComponentHarness } from "@angular/cdk/testing";

import { SeasonEditorHarnessBase } from "./season-editor.harness.base";

export class SeasonEditorHarness
  extends ComponentHarness
  implements SeasonEditorHarnessBase
{
  static hostSelector = SeasonEditorHarnessBase.hostSelector;

  protected getNameEl = this.locatorFor(
    SeasonEditorHarnessBase.selectors.nameInput,
  );
  protected getDropsEl = this.locatorFor(
    SeasonEditorHarnessBase.selectors.dropsInput,
  );
  protected getAddRaceBtn = this.locatorFor(
    SeasonEditorHarnessBase.selectors.addRaceBtn,
  );
  protected getCopyBtn = this.locatorForOptional(
    SeasonEditorHarnessBase.selectors.copyBtn,
  );
  protected getExpanderCards = this.locatorForAll(
    SeasonEditorHarnessBase.selectors.expanderCards,
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

  async getDrops(): Promise<number> {
    const input = await this.getDropsEl();
    const val = await input.getProperty("value");
    return Number(val);
  }

  async setDrops(drops: number): Promise<void> {
    const input = await this.getDropsEl();
    await input.clear();
    await input.sendKeys(String(drops));
  }

  async clickCopy(): Promise<void> {
    const btn = await this.getCopyBtn();
    if (btn) {
      await btn.click();
    }
  }

  async clickAddRace(): Promise<void> {
    const btn = await this.getAddRaceBtn();
    await btn.click();
  }

  async getRaceExpanderCount(): Promise<number> {
    const cards = await this.getExpanderCards();
    return cards.length;
  }
}
