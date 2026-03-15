import { Locator } from '@playwright/test';
import { DriverManagerHarnessBase } from './driver-manager.harness.base';
import { ManagerHeaderHarnessE2e } from '../../shared/manager-header/testing/manager-header.harness.e2e';
import { ManagerHeaderHarnessBase } from '../../shared/manager-header/testing/manager-header.harness.base';


export class DriverManagerHarnessE2e implements DriverManagerHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return DriverManagerHarnessBase; }

  private get searchInput() { return this.locator.locator(this.base.selectors.searchInput); }
  private get driverRows() { return this.locator.locator(this.base.selectors.driverRow); }
  private get configNameInput() { return this.locator.locator(this.base.selectors.configNameInput).first(); }


  async getDriverCount(): Promise<number> {
    return await this.driverRows.count();
  }

  async getDriverName(index: number): Promise<string> {
    const row = this.driverRows.nth(index);
    return await row.locator(this.base.selectors.nameCell).innerText();
  }

  async getDriverNickname(index: number): Promise<string> {
    const row = this.driverRows.nth(index);
    return await row.locator(this.base.selectors.nicknameCell).innerText();
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
    const header = new ManagerHeaderHarnessE2e(this.locator.locator(ManagerHeaderHarnessBase.hostSelector));
    await header.getToolbar().clickEdit();
  }

  async clickDelete(): Promise<void> {
    const header = new ManagerHeaderHarnessE2e(this.locator.locator(ManagerHeaderHarnessBase.hostSelector));
    await header.getToolbar().clickDelete();
  }

}
