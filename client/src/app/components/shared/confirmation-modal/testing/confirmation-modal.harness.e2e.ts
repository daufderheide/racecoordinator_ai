import { Locator } from '@playwright/test';
import { ConfirmationModalHarnessBase } from './confirmation-modal.harness.base';

export class ConfirmationModalHarnessE2e implements ConfirmationModalHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return ConfirmationModalHarnessBase; }

  private get modalContent() { return this.locator.locator(this.base.selectors.content); }
  private get titleElement() { return this.locator.locator(this.base.selectors.title); }
  private get messageElement() { return this.locator.locator(this.base.selectors.message); }
  private get confirmButton() { return this.locator.locator(this.base.selectors.confirmButton); }
  private get cancelButton() { return this.locator.locator(this.base.selectors.cancelButton); }

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
