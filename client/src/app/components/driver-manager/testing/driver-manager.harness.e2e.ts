import { Locator } from '@playwright/test';
import { DriverManagerHarnessBase } from './driver-manager.harness.base';

export class DriverManagerHarnessE2e implements DriverManagerHarnessBase {
  constructor(private locator: Locator) {}

  private get searchInput() { return this.locator.locator('.search-input'); }
  private get driverRows() { return this.locator.locator('.driver-table.body-only tbody tr'); }
  private get configNameInput() { return this.locator.locator('.config-panel input').first(); }
  private get editBtn() { return this.locator.locator('.btn-edit'); }
  private get deleteBtn() { return this.locator.locator('.btn-delete'); }

  async getDriverCount(): Promise<number> {
    return await this.driverRows.count();
  }

  async getDriverName(index: number): Promise<string> {
    const row = this.driverRows.nth(index);
    return await row.locator('.name-cell').innerText();
  }

  async getDriverNickname(index: number): Promise<string> {
    const row = this.driverRows.nth(index);
    return await row.locator('.nickname-cell').innerText();
  }

  async selectDriver(index: number): Promise<void> {
    await this.driverRows.nth(index).click();
  }

  async setSearchQuery(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async getSelectedDriverName(): Promise<string> {
    return await this.configNameInput.inputValue();
  }

  async clickEdit(): Promise<void> {
    await this.editBtn.click();
  }

  async clickDelete(): Promise<void> {
    await this.deleteBtn.click();
  }
}
