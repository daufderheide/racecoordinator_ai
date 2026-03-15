import { Locator } from '@playwright/test';
import { ReorderDialogHarnessBase } from './reorder-dialog.harness.base';

export class ReorderDialogHarnessE2e implements ReorderDialogHarnessBase {
  constructor(private locator: Locator) {}

  private get backdrop() { return this.locator.locator('.modal-backdrop'); }
  private get titleText() { return this.locator.locator('.title'); }
  private get valueChips() { return this.locator.locator('.value-chip'); }
  private get slotItems() { return this.locator.locator('.slot-item'); }
  private get saveBtn() { return this.locator.locator('.btn-save'); }
  private get cancelBtn() { return this.locator.locator('.btn-secondary'); }

  async isVisible(): Promise<boolean> {
    return await this.backdrop.isVisible();
  }

  async getTitle(): Promise<string> {
    return await this.titleText.innerText();
  }

  async getAvailableValues(): Promise<string[]> {
    const count = await this.valueChips.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
        values.push(await this.valueChips.nth(i).innerText());
    }
    return values;
  }

  async getSlotCount(): Promise<number> {
    return await this.slotItems.count();
  }

  async getSlotTitle(index: number): Promise<string> {
    const item = this.slotItems.nth(index);
    return await item.locator('.slot-title').innerText();
  }

  async clickRemoveSlot(index: number): Promise<void> {
    const item = this.slotItems.nth(index);
    await item.locator('.remove-btn').click();
  }

  async clickResetDefaults(): Promise<void> {
    await this.locator.locator('.btn-reset-defaults').click();
  }

  async clickSave(): Promise<void> {
    await this.saveBtn.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelBtn.click();
  }
}

