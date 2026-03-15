import { ComponentHarness } from '@angular/cdk/testing';
import { ImageSetEditorHarnessBase } from './image-set-editor.harness.base';

export class ImageSetEditorHarness extends ComponentHarness implements ImageSetEditorHarnessBase {
  static hostSelector = 'app-image-set-editor';

  protected getBackdrop = this.locatorForOptional('.modal-backdrop');
  protected getTitleText = this.locatorFor('.modal-title');
  protected getNameInput = this.locatorFor('.form-input');
  protected getEntriesCount = this.locatorForAll('.entry-item');
  protected getAddBtn = this.locatorFor('.btn-add');
  protected getSaveBtn = this.locatorFor('.btn-save');
  protected getCancelBtn = this.locatorFor('.btn-cancel');

  async isVisible(): Promise<boolean> {
    const backdrop = await this.getBackdrop();
    return backdrop !== null;
  }

  async getTitle(): Promise<string> {
    const el = await this.getTitleText();
    return await el.text();
  }

  async getName(): Promise<string> {
    const input = await this.getNameInput();
    return await input.getProperty('value');
  }

  async setName(name: string): Promise<void> {
    const input = await this.getNameInput();
    await input.clear();
    await input.sendKeys(name);
  }

  async getEntryCount(): Promise<number> {
    return (await this.getEntriesCount()).length;
  }

  async clickAddEntry(): Promise<void> {
    const btn = await this.getAddBtn();
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
