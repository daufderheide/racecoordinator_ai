import { ComponentHarness } from '@angular/cdk/testing';
import { ItemSelectorHarnessBase } from './item-selector.harness.base';

export class ItemSelectorHarness extends ComponentHarness implements ItemSelectorHarnessBase {
  static hostSelector = ItemSelectorHarnessBase.hostSelector;

  protected getModalContent = this.locatorForOptional(ItemSelectorHarnessBase.selectors.content);
  protected getBackdrop = this.locatorForOptional(ItemSelectorHarnessBase.selectors.backdrop);
  protected getItems = this.locatorForAll(ItemSelectorHarnessBase.selectors.itemCard);
  protected getPlayButtons = this.locatorForAll(ItemSelectorHarnessBase.selectors.playPreview);

  async isVisible(): Promise<boolean> {
    return (await this.getModalContent()) !== null;
  }

  async getItemsCount(): Promise<number> {
    const items = await this.getItems();
    return items.length;
  }

  async getItemText(index: number): Promise<string> {
    const items = await this.getItems();
    if (index >= 0 && index < items.length) {
      return await items[index].text();
    }
    throw new Error(`Item index ${index} out of bounds.`);
  }

  async clickItem(index: number): Promise<void> {
    const items = await this.getItems();
    if (index >= 0 && index < items.length) {
      await items[index].click();
      return;
    }
    throw new Error(`Item index ${index} out of bounds.`);
  }

  async clickPlayItem(index: number): Promise<void> {
    // Note: The Play button might only exist for sound items.
    const buttons = await this.getPlayButtons();
    if (index >= 0 && index < buttons.length) {
      await buttons[index].click();
      return;
    }
    throw new Error(`Play button index ${index} out of bounds.`);
  }

  async clickClose(): Promise<void> {
    const backdrop = await this.getBackdrop();
    if (backdrop) {
      await backdrop.click();
    }
  }
}
