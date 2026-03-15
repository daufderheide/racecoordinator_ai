import { ComponentHarness } from '@angular/cdk/testing';
import { DatabaseManagerHarnessBase } from './database-manager.harness.base';

export class DatabaseManagerHarness extends ComponentHarness implements DatabaseManagerHarnessBase {
  static hostSelector = 'app-database-manager';

  protected getListItems = this.locatorForAll('.list-item');
  protected getCreateBtn = this.locatorFor('button:has-text("CREATE NEW")'); // Adjust based on test usage if needed
  protected getImportBtn = this.locatorFor('button:has-text("IMPORT")');
  protected getUseBtn = this.locatorFor('button:has-text("USE DATABASE")');
  protected getDetailHeader = this.locatorForOptional('.detail-header h2');
  protected getInputModal = this.locatorForOptional('.modal-backdrop');

  async getDatabaseCount(): Promise<number> {
    return (await this.getListItems()).length;
  }

  async getDatabaseName(index: number): Promise<string> {
    const items = await this.getListItems();
    if (index < items.length) {
      return await items[index].locator('.item-name').text();
    }
    return '';
  }

  async selectDatabase(index: number): Promise<void> {
    const items = await this.getListItems();
    if (index < items.length) {
      await items[index].click();
    }
  }

  async getSelectedDatabaseName(): Promise<string | null> {
    const header = await this.getDetailHeader();
    return header ? await header.text() : null;
  }

  async clickCreateDatabase(): Promise<void> {
    await (await this.getCreateBtn()).click();
  }

  async clickImportDatabase(): Promise<void> {
    await (await this.getImportBtn()).click();
  }

  async clickUseDatabase(): Promise<void> {
    await (await this.getUseBtn()).click();
  }

  async isUseDatabaseEnabled(): Promise<boolean> {
    const btn = await this.getUseBtn();
    return !(await btn.getAttribute('disabled') === ''); // Or similar check
  }

  // Modal interactions
  async isInputModalVisible(): Promise<boolean> {
    return (await this.getInputModal()) !== null;
  }

  async getInputModalTitle(): Promise<string> {
    const modal = await this.getInputModal();
    return modal ? await modal.locator('.modal-title').text() : '';
  }

  async setInputModalValue(value: string): Promise<void> {
    const modal = await this.getInputModal();
    if (modal) {
      const input = await modal.locator('input');
      // CDK way to set value or simulate typing
      // item.sendKeys(...) or similar.
    }
  }

  async clickInputModalConfirm(): Promise<void> {
    const modal = await this.getInputModal();
    if (modal) {
      await modal.locator('.btn-confirm').click();
    }
  }

  async isInputModalConfirmEnabled(): Promise<boolean> {
      const modal = await this.getInputModal();
      if (modal) {
          const btn = await modal.locator('.btn-confirm');
          return !(await btn.getAttribute('disabled') === '');
      }
      return false;
  }

  async isInputModalErrorVisible(): Promise<boolean> {
      const modal = await this.getInputModal();
      if (modal) {
          const error = await modal.locator('.error-msg');
          return await error.getAttribute('style') === 'visibility: visible';
      }
      return false;
  }
}
