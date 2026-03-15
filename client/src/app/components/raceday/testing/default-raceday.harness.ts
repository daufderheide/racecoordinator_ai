import { ComponentHarness } from '@angular/cdk/testing';
import { DefaultRacedayHarnessBase } from './default-raceday.harness.base';

export class DefaultRacedayHarness extends ComponentHarness implements DefaultRacedayHarnessBase {
  static hostSelector = 'app-default-raceday';

  protected getDriverRows = this.locatorForAll('.driver-row');
  protected getMenuButtons = this.locatorForAll('.menu-button-top');
  protected getMenuItems = this.locatorForAll('.menu-item');
  protected getHeaders = this.locatorForAll('.table-headers text');

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
