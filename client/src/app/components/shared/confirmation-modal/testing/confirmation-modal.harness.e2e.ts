import { Locator } from '@playwright/test';
import { ConfirmationModalHarnessBase } from './confirmation-modal.harness.base';

export class ConfirmationModalHarnessE2e implements ConfirmationModalHarnessBase {
  constructor(private locator: Locator) {}

  private get modalContent() { return this.locator.locator('.modal-content'); }
  private get titleElement() { return this.locator.locator('.modal-title'); }
  private get messageElement() { return this.locator.locator('.modal-message'); }
  private get confirmButton() { return this.locator.locator('.btn-confirm'); }
  private get cancelButton() { return this.locator.locator('.btn-cancel'); }

  async isVisible(): Promise<boolean> {
    return await this.modalContent.isVisible();
  }

  async getTitle(): Promise<string> {
    return await this.titleElement.innerText();
  }

  async getMessage(): Promise<string> {
    return await this.messageElement.innerText();
  }

  async clickConfirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async getConfirmText(): Promise<string> {
    return await this.confirmButton.innerText();
  }

  async getCancelText(): Promise<string> {
    return await this.cancelButton.innerText();
  }
}
