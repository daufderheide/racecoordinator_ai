import { ComponentHarness } from '@angular/cdk/testing';
import { UIEditorHarnessBase } from './ui-editor.harness.base';
import { ReorderDialogHarness } from '..//reorder-dialog/testing/reorder-dialog.harness';

export class UIEditorHarness extends ComponentHarness implements UIEditorHarnessBase {
  static hostSelector = UIEditorHarnessBase.hostSelector;

  protected getReorderBtn = this.locatorFor(UIEditorHarnessBase.selectors.reorderBtn);
  protected getReorderDialog = this.locatorFor(ReorderDialogHarness);
  protected getImageSelectors = this.locatorForAll(UIEditorHarnessBase.selectors.imageSelector);

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
        const preview = await selectors[index].locatorFor(UIEditorHarnessBase.selectors.imagePreview)();
        await preview.click();
    }
  }
}
