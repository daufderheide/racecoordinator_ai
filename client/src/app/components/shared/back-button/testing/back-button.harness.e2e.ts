import { Locator, Page } from '@playwright/test';
import { BackButtonHarnessBase } from './back-button.harness.base';

export class BackButtonHarnessE2e implements BackButtonHarnessBase {
  constructor(private locator: Locator, private page?: Page) {}

  private get button() { return this.locator.locator('.back-btn'); }

  async click(): Promise<void> {
    await this.button.click();
  }

  async getLabel(): Promise<string> {
    const text = await this.button.innerText();
    return text.replace(/[‹\s]/g, '').trim();
  }

  async clickModalConfirm(): Promise<void> {
    if (!this.page) throw new Error('Page context required for modal interactions');
    await this.page.locator('app-confirmation-modal .btn-confirm').click();
  }

  async clickModalCancel(): Promise<void> {
    if (!this.page) throw new Error('Page context required for modal interactions');
    await this.page.locator('app-confirmation-modal .btn-cancel').click();
  }
}
