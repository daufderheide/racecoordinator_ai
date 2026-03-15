import { Locator } from '@playwright/test';
import { UIEditorHarnessBase } from './ui-editor.harness.base';
import { ReorderDialogHarnessE2e } from '..//reorder-dialog/testing/reorder-dialog.harness.e2e';

export class UIEditorHarnessE2e implements UIEditorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return UIEditorHarnessBase; }

  private get reorderBtn() { return this.locator.locator(this.base.selectors.reorderBtn).first(); }
  private get reorderDialog() { return this.locator.locator('app-reorder-dialog'); }
  private get imageSelectors() { return this.locator.locator(this.base.selectors.imageSelector); }

  async clickReorderColumns(): Promise<void> {
    await this.reorderBtn.click();
  }

  async getReorderDialogHarness(): Promise<ReorderDialogHarnessE2e> {
    return new ReorderDialogHarnessE2e(this.reorderDialog);
  }

  async clickImageSelector(index: number): Promise<void> {
    const selector = this.imageSelectors.nth(index);
    await selector.locator(this.base.selectors.imagePreview).click();
  }
}
