import { Locator } from '@playwright/test';
import { AcknowledgementModalHarnessBase } from './acknowledgement-modal.harness.base';

export class AcknowledgementModalHarnessE2e implements AcknowledgementModalHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return AcknowledgementModalHarnessBase; }

  private get modalBackdrop() { return this.locator.page().locator(`${this.base.hostSelector} ${this.base.selectors.backdrop}`); }
  private get modalContent() { return this.locator.page().locator(`${this.base.hostSelector} ${this.base.selectors.content}`); }
  private get titleElement() { return this.locator.page().locator(`${this.base.hostSelector} ${this.base.selectors.title}`); }
  private get messageElement() { return this.locator.page().locator(`${this.base.hostSelector} ${this.base.selectors.message}`); }
  private get confirmButton() { return this.locator.page().locator(`${this.base.hostSelector} ${this.base.selectors.confirmButton}`); }

  /** Uses Playwright native waitFor — properly auto-waits for the modal to appear. */
  async waitForVisible(timeout = 10000): Promise<void> {
    await this.modalContent.waitFor({ state: 'visible', timeout });
  }

  async isVisible(): Promise<boolean> {
    return await this.modalBackdrop.isVisible();
  }

  async getTitle(): Promise<string> {
    return await this.titleElement.innerText();
  }

  async getMessage(): Promise<string> {
    return await this.messageElement.innerText();
  }

  async clickAcknowledge(): Promise<void> {
    await this.confirmButton.click();
  }

  async getButtonText(): Promise<string> {
    return await this.confirmButton.innerText();
  }
}
