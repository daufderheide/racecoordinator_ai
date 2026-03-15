import { ComponentHarness } from '@angular/cdk/testing';
import { DatabaseManagerHarnessBase } from './database-manager.harness.base';

export class DatabaseManagerHarness extends ComponentHarness implements DatabaseManagerHarnessBase {
  static hostSelector = DatabaseManagerHarnessBase.hostSelector;

  private get base() { return DatabaseManagerHarnessBase; }

  protected getListItems = this.locatorForAll(DatabaseManagerHarnessBase.selectors.listItem);
  protected getCreateBtn = this.locatorFor(DatabaseManagerHarnessBase.selectors.createBtn);
  protected getImportBtn = this.locatorFor(DatabaseManagerHarnessBase.selectors.importBtn);
  protected getUseBtn = this.locatorFor(DatabaseManagerHarnessBase.selectors.useBtn);
  protected getDetailHeader = this.locatorForOptional(DatabaseManagerHarnessBase.selectors.detailHeader);
  protected getInputModal = this.locatorForOptional(DatabaseManagerHarnessBase.selectors.modalBackdrop);

  async getDatabaseCount(): Promise<number> {
    return (await this.getListItems()).length;
  }

  async getDatabaseName(index: number): Promise<string> {
    const items = await this.getListItems();
    if (index < items.length) {
      return await items[index].locator(this.base.selectors.itemName).text();
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
    return modal ? await modal.locator(this.base.selectors.modalTitle).text() : '';
  }

  async setInputModalValue(value: string): Promise<void> {
    const modal = await this.getInputModal();
    if (modal) {
      const input = await modal.locator(this.base.selectors.input);
      // CDK way to set value or simulate typing
    }
  }

  async clickInputModalConfirm(): Promise<void> {
    const modal = await this.getInputModal();
    if (modal) {
      await modal.locator(this.base.selectors.btnConfirm).click();
    }
  }

  async isInputModalConfirmEnabled(): Promise<boolean> {
      const modal = await this.getInputModal();
      if (modal) {
          const btn = await modal.locator(this.base.selectors.btnConfirm);
          return !(await btn.getAttribute('disabled') === '');
      }
      return false;
  }

  async isInputModalErrorVisible(): Promise<boolean> {
      const modal = await this.getInputModal();
      if (modal) {
          const error = await modal.locator(this.base.selectors.errorMsg);
          return await error.getAttribute('style') === 'visibility: visible';
      }
      return false;
  }
}
