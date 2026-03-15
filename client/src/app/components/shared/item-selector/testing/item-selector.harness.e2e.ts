import { Locator } from '@playwright/test';
import { ItemSelectorHarnessBase } from './item-selector.harness.base';

export class ItemSelectorHarnessE2e implements ItemSelectorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return ItemSelectorHarnessBase; }

  private get modalContent() { return this.locator.locator(this.base.selectors.content); }
  private get backdrop() { return this.locator.locator(this.base.selectors.backdrop); }
  private get items() { return this.locator.locator(this.base.selectors.itemCard); }
  private get playButtons() { return this.locator.locator(this.base.selectors.playPreview); }

  async isVisible(): Promise<boolean> {
    return await this.modalContent.isVisible();
  }

  async getItemsCount(): Promise<number> {
    return await this.items.count();
  }

  async getItemText(index: number): Promise<string> {
    const count = await this.getItemsCount();
    if (index >= 0 && index < count) {
      return await this.items.nth(index).innerText();
    }
    throw new Error(`Item index ${index} out of bounds.`);
  }

  async clickItem(index: number): Promise<void> {
    const count = await this.getItemsCount();
    if (index >= 0 && index < count) {
      await this.items.nth(index).click();
      return;
    }
    throw new Error(`Item index ${index} out of bounds.`);
  }

  async clickPlayItem(index: number): Promise<void> {
    const count = await this.playButtons.count();
    if (index >= 0 && index < count) {
      await this.playButtons.nth(index).click();
      return;
    }
    throw new Error(`Play button index ${index} out of bounds.`);
  }

  async clickClose(): Promise<void> {
    await this.backdrop.click();
  }
}
