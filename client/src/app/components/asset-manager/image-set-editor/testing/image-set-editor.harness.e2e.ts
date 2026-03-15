import { Locator } from '@playwright/test';
import { ImageSetEditorHarnessBase } from './image-set-editor.harness.base';

export class ImageSetEditorHarnessE2e implements ImageSetEditorHarnessBase {
  constructor(private locator: Locator) {}

  private get backdrop() { return this.locator.locator('.modal-backdrop'); }
  private get titleText() { return this.locator.locator('.modal-title'); }
  private get nameInput() { return this.locator.locator('.form-input'); }
  private get entries() { return this.locator.locator('.entry-item'); }
  private get addBtn() { return this.locator.locator('.btn-add'); }
  private get saveBtn() { return this.locator.locator('.btn-save'); }
  private get cancelBtn() { return this.locator.locator('.btn-cancel'); }

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
