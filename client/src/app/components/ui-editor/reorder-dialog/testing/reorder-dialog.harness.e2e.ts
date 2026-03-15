import { Locator } from '@playwright/test';
import { ReorderDialogHarnessBase } from './reorder-dialog.harness.base';

export class ReorderDialogHarnessE2e implements ReorderDialogHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return ReorderDialogHarnessBase; }

  private get backdrop() { return this.locator.locator(this.base.selectors.backdrop); }
  private get titleText() { return this.locator.locator(this.base.selectors.title); }
  private get valueChips() { return this.locator.locator(this.base.selectors.valueChip); }
  private get slotItems() { return this.locator.locator(this.base.selectors.slotItem); }
  private get saveBtn() { return this.locator.locator(this.base.selectors.saveBtn); }
  private get cancelBtn() { return this.locator.locator(this.base.selectors.cancelBtn); }

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
    return await item.locator(this.base.selectors.slotTitle).innerText();
  }

  async clickRemoveSlot(index: number): Promise<void> {
    const item = this.slotItems.nth(index);
    await item.locator(this.base.selectors.removeBtn).click();
  }

  async clickResetDefaults(): Promise<void> {
    await this.locator.locator(this.base.selectors.resetDefaultsBtn).click();
  }

  async clickSave(): Promise<void> {
    await this.saveBtn.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelBtn.click();
  }
}

