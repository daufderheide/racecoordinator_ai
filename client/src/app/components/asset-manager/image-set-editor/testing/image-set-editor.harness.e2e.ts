import { Locator } from '@playwright/test';
import { ImageSetEditorHarnessBase } from './image-set-editor.harness.base';

export class ImageSetEditorHarnessE2e implements ImageSetEditorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return ImageSetEditorHarnessBase; }

  private get backdrop() { return this.locator.locator(this.base.selectors.backdrop); }
  private get titleText() { return this.locator.locator(this.base.selectors.title); }
  private get nameInput() { return this.locator.locator(this.base.selectors.nameInput); }
  private get entries() { return this.locator.locator(this.base.selectors.entry); }
  private get addBtn() { return this.locator.locator(this.base.selectors.addBtn); }
  private get saveBtn() { return this.locator.locator(this.base.selectors.saveBtn); }
  private get cancelBtn() { return this.locator.locator(this.base.selectors.cancelBtn); }

  async isVisible(): Promise<boolean> {
    return await this.backdrop.isVisible();
  }

  async getTitle(): Promise<string> {
    return await this.titleText.innerText();
  }

  async getName(): Promise<string> {
    return await this.nameInput.inputValue();
  }

  async setName(name: string): Promise<void> {
    await this.nameInput.fill(name);
  }

  async getEntryCount(): Promise<number> {
    return await this.entries.count();
  }

  async clickAddEntry(): Promise<void> {
    await this.addBtn.click();
  }

  async clickSave(): Promise<void> {
    await this.saveBtn.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelBtn.click();
  }
}
