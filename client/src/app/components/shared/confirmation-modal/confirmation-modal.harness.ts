import { ComponentHarness } from '@angular/cdk/testing';
import { ConfirmationModalHarnessBase } from './confirmation-modal.harness.base';

export class ConfirmationModalHarness extends ComponentHarness implements ConfirmationModalHarnessBase {
  static hostSelector = 'app-confirmation-modal';

  protected getModalContent = this.locatorForOptional('.modal-content');
  protected getTitleElement = this.locatorForOptional('.modal-title');
  protected getMessageElement = this.locatorForOptional('.modal-message');
  protected getConfirmButton = this.locatorForOptional('.btn-confirm');
  protected getCancelButton = this.locatorForOptional('.btn-cancel');

  async isVisible(): Promise<boolean> {
    return (await this.getModalContent()) !== null;
  }

  async getTitle(): Promise<string> {
    const el = await this.getTitleElement();
    return el ? await el.text() : '';
  }

  async getMessage(): Promise<string> {
    const el = await this.getMessageElement();
    return el ? await el.text() : '';
  }

  async clickConfirm(): Promise<void> {
    const btn = await this.getConfirmButton();
    if (btn) await btn.click();
  }

  async clickCancel(): Promise<void> {
    const btn = await this.getCancelButton();
    if (btn) await btn.click();
  }

  async getConfirmText(): Promise<string> {
    const el = await this.getConfirmButton();
    return el ? await el.text() : '';
  }

  async getCancelText(): Promise<string> {
    const el = await this.getCancelButton();
    return el ? await el.text() : '';
  }
}
