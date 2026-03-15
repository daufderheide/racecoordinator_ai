import { ComponentHarness } from '@angular/cdk/testing';
import { UIEditorHarnessBase } from './ui-editor.harness.base';
import { ReorderDialogHarness } from '..//reorder-dialog/testing/reorder-dialog.harness';

export class UIEditorHarness extends ComponentHarness implements UIEditorHarnessBase {
  static hostSelector = 'app-ui-editor';

  protected getReorderBtn = this.locatorFor('.column-actions button');
  protected getReorderDialog = this.locatorFor(ReorderDialogHarness);
  protected getImageSelectors = this.locatorForAll('app-image-selector');

  async clickReorderColumns(): Promise<void> {
    const btn = await this.getReorderBtn();
    await btn.click();
  }

  async getReorderDialogHarness(): Promise<ReorderDialogHarness> {
    return await this.getReorderDialog();
  }

  async clickImageSelector(index: number): Promise<void> {
    const selectors = await this.getImageSelectors();
    if (index < selectors.length) {
        const preview = await selectors[index].locatorFor('.image-preview')();
        await preview.click();
    }
  }
}
