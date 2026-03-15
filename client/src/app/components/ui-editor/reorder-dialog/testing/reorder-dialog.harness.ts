import { ComponentHarness } from '@angular/cdk/testing';
import { ReorderDialogHarnessBase } from './reorder-dialog.harness.base';

export class ReorderDialogHarness extends ComponentHarness implements ReorderDialogHarnessBase {
  static hostSelector = 'app-reorder-dialog';

  protected getBackdrop = this.locatorForOptional('.modal-backdrop');
  protected getTitleText = this.locatorFor('.title');
  protected getValueChips = this.locatorForAll('.value-chip');
  protected getSlotItems = this.locatorForAll('.slot-item');
  protected getSaveBtn = this.locatorFor('.btn-save');
  protected getCancelBtn = this.locatorFor('.btn-secondary');

  async isVisible(): Promise<boolean> {
    const backdrop = await this.getBackdrop();
    return backdrop !== null;
  }

  async getTitle(): Promise<string> {
    const el = await this.getTitleText();
    return await el.text();
  }

  async getAvailableValues(): Promise<string[]> {
    const chips = await this.getValueChips();
    const values: string[] = [];
    for (const chip of chips) {
        values.push(await chip.text());
    }
    return values;
  }

  async getSlotCount(): Promise<number> {
    return (await this.getSlotItems()).length;
  }

  async getSlotTitle(index: number): Promise<string> {
    const items = await this.getSlotItems();
    if (index < items.length) {
        const title = await items[index].locatorFor('.slot-title')();
        return await title.text();
    }
    return '';
  }

  async clickRemoveSlot(index: number): Promise<void> {
    const items = await this.getSlotItems();
    if (index < items.length) {
        const btn = await items[index].locatorFor('.remove-btn')();
        await btn.click();
    }
  }

  async clickResetDefaults(): Promise<void> {
    const btn = await this.locatorFor('.btn-reset-defaults')();
    await btn.click();
  }

  async clickSave(): Promise<void> {
    const btn = await this.getSaveBtn();
    await btn.click();
  }

  async clickCancel(): Promise<void> {
    const btn = await this.getCancelBtn();
    await btn.click();
  }
}
