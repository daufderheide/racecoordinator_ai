import { Locator } from '@playwright/test';
import { TeamEditorHarnessBase } from './team-editor.harness.base';

export class TeamEditorHarnessE2e implements TeamEditorHarnessBase {
  constructor(private locator: Locator) {}

  private get nameInput() { return this.locator.locator('input.dm-input'); }
  private get saveBtn() { return this.locator.locator('.btn-save'); }
  private get saveAsNewBtn() { return this.locator.locator('.btn-save-new'); }
  private get driverItems() { return this.locator.locator('.driver-item'); }
  private get avatarSelector() { return this.locator.locator('app-image-selector .image-preview'); }

  async getName(): Promise<string> {
    return await this.nameInput.inputValue();
  }

  async setName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async clickSave(): Promise<void> {
    await this.saveBtn.click();
  }

  async clickSaveAsNew(): Promise<void> {
    await this.saveAsNewBtn.click();
  }

  async getDriverCount(): Promise<number> {
    return await this.driverItems.count();
  }

  async getDriverName(index: number): Promise<string> {
    const item = this.driverItems.nth(index);
    return await item.locator('.driver-name').innerText();
  }

  async isDriverSelected(index: number): Promise<boolean> {
    const item = this.driverItems.nth(index);
    const classes = await item.getAttribute('class');
    return classes ? classes.includes('selected') : false;
  }

  async toggleDriver(index: number): Promise<void> {
    await this.driverItems.nth(index).click();
  }

  async clickAvatar(): Promise<void> {
    await this.avatarSelector.click({ force: true });
  }

  async isSaveEnabled(): Promise<boolean> {
    return await this.saveBtn.isEnabled();
  }
}

