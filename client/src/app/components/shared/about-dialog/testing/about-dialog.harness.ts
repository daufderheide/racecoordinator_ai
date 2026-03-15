import { ComponentHarness } from '@angular/cdk/testing';
import { AboutDialogHarnessBase } from './about-dialog.harness.base';

export class AboutDialogHarness extends ComponentHarness implements AboutDialogHarnessBase {
  static hostSelector = 'app-about-dialog';

  protected getModalContent = this.locatorForOptional('.modal-content');
  protected getTitleElement = this.locatorForOptional('.modal-title');
  protected getVersionInfoElement = this.locatorForOptional('.version-info');
  protected getCloseButton = this.locatorForOptional('.btn-confirm');

  async isVisible(): Promise<boolean> {
    return (await this.getModalContent()) !== null;
  }

  async getTitle(): Promise<string> {
    const el = await this.getTitleElement();
    return el ? await el.text() : '';
  }

  async getVersionInfoText(): Promise<string> {
    const el = await this.getVersionInfoElement();
    return el ? await el.text() : '';
  }

  async clickClose(): Promise<void> {
    const btn = await this.getCloseButton();
    if (btn) await btn.click();
  }
}
