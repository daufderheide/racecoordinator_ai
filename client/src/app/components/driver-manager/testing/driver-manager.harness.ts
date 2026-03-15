import { ComponentHarness } from '@angular/cdk/testing';
import { DriverManagerHarnessBase } from './driver-manager.harness.base';

export class DriverManagerHarness extends ComponentHarness implements DriverManagerHarnessBase {
  static hostSelector = 'app-driver-manager';

  protected getSearchInput = this.locatorFor('.search-input');
  protected getDriverRows = this.locatorForAll('.driver-table.body-only tbody tr');
  protected getConfigNameInput = this.locatorFor('.config-panel input');
  protected getEditBtn = this.locatorFor('.btn-edit');
  protected getDeleteBtn = this.locatorFor('.btn-delete');

  async getDriverCount(): Promise<number> {
    return (await this.getDriverRows()).length;
  }

  async getDriverName(index: number): Promise<string> {
    const rows = await this.getDriverRows();
    if (index < rows.length) {
      const nameCell = await rows[index].locatorFor('.name-cell')();
      return await nameCell.text();
    }
    return '';
  }

  async getDriverNickname(index: number): Promise<string> {
    const rows = await this.getDriverRows();
    if (index < rows.length) {
      const nicknameCell = await rows[index].locatorFor('.nickname-cell')();
      return await nicknameCell.text();
    }
    return '';
  }

  async selectDriver(index: number): Promise<void> {
    const rows = await this.getDriverRows();
    if (index < rows.length) {
      await rows[index].click();
    }
  }

  async setSearchQuery(query: string): Promise<void> {
    const input = await this.getSearchInput();
    await input.clear();
    await input.sendKeys(query);
  }

  async getSelectedDriverName(): Promise<string> {
    const input = await this.getConfigNameInput();
    return await input.getProperty('value');
  }

  async clickEdit(): Promise<void> {
    const btn = await this.getEditBtn();
    await btn.click();
  }

  async clickDelete(): Promise<void> {
    const btn = await this.getDeleteBtn();
    await btn.click();
  }
}
