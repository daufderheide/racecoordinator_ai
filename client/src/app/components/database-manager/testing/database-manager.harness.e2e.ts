import { Locator } from '@playwright/test';
import { DatabaseManagerHarnessBase } from './database-manager.harness.base';

export class DatabaseManagerHarnessE2e implements DatabaseManagerHarnessBase {
  constructor(private locator: Locator) {}

  private get listItems() { return this.locator.locator('.list-item'); }
  private get createBtn() { return this.locator.locator('button:has-text("CREATE")'); }
  private get importBtn() { return this.locator.locator('button:has-text("IMPORT")'); }
  private get useBtn() { return this.locator.locator('button:has-text("USE")'); }
  private get detailHeader() { return this.locator.locator('.detail-header h2'); }
  private get inputModal() { return this.locator.locator('.modal-backdrop'); }

  async getDatabaseCount(): Promise<number> {
    return await this.listItems.count();
  }

  async getDatabaseName(index: number): Promise<string> {
    return await this.listItems.nth(index).locator('.item-name').innerText();
  }

  async selectDatabase(index: number): Promise<void> {
    await this.listItems.nth(index).click();
  }

  async getSelectedDatabaseName(): Promise<string | null> {
    if (await this.detailHeader.isVisible()) {
      return await this.detailHeader.innerText();
    }
    return null;
  }

  async clickCreateDatabase(): Promise<void> {
    await this.createBtn.click();
  }

  async clickImportDatabase(): Promise<void> {
    await this.importBtn.click();
  }

  async clickUseDatabase(): Promise<void> {
    await this.useBtn.click();
  }

  async isUseDatabaseEnabled(): Promise<boolean> {
    return await this.useBtn.isEnabled();
  }

  // Modal interactions
  async isInputModalVisible(): Promise<boolean> {
    return await this.inputModal.isVisible();
  }

  async getInputModalTitle(): Promise<string> {
    return await this.inputModal.locator('.modal-title').innerText();
  }

  async setInputModalValue(value: string): Promise<void> {
    await this.inputModal.locator('.input-container input').fill(value);
  }

  async clickInputModalConfirm(): Promise<void> {
    await this.inputModal.locator('.btn-confirm').click();
  }

  async isInputModalConfirmEnabled(): Promise<boolean> {
    return await this.inputModal.locator('.btn-confirm').isEnabled();
  }

  async isInputModalErrorVisible(): Promise<boolean> {
    return await this.inputModal.locator('.error-msg').isVisible();
  }
}
