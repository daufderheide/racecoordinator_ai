import { ComponentHarness } from '@angular/cdk/testing';
import { DefaultRacedayHarnessBase } from './default-raceday.harness.base';

export class DefaultRacedayHarness extends ComponentHarness implements DefaultRacedayHarnessBase {
  static hostSelector = DefaultRacedayHarnessBase.hostSelector;

  protected getDriverRows = this.locatorForAll(DefaultRacedayHarnessBase.selectors.driverRow);
  protected getMenuButtons = this.locatorForAll(DefaultRacedayHarnessBase.selectors.menuButton);
  protected getMenuItems = this.locatorForAll(DefaultRacedayHarnessBase.selectors.menuItem);
  protected getHeaders = this.locatorForAll(DefaultRacedayHarnessBase.selectors.headerText);

  async getDriverRowCount(): Promise<number> {
    return (await this.getDriverRows()).length;
  }

  async getDriverRowText(index: number): Promise<string> {
    const rows = await this.getDriverRows();
    if (index < rows.length) {
      return await rows[index].text();
    }
    return '';
  }

  async clickMenuButton(name: string): Promise<void> {
    const buttons = await this.getMenuButtons();
    for (const btn of buttons) {
      if (await btn.text() === name) {
        await btn.click();
        return;
      }
    }
  }

  async clickMenuItem(name: string): Promise<void> {
    const items = await this.getMenuItems();
    for (const item of items) {
      if (await item.text() === name) {
        await item.click();
        return;
      }
    }
  }

  async isHeaderColumnVisible(text: string): Promise<boolean> {
    const headers = await this.getHeaders();
    for (const header of headers) {
      if ((await header.text()).includes(text)) {
        return true;
      }
    }
    return false;
  }
}
