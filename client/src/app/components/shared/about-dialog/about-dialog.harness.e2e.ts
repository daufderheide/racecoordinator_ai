import { Locator } from '@playwright/test';
import { AboutDialogHarnessBase } from './about-dialog.harness.base';

export class AboutDialogHarnessE2e implements AboutDialogHarnessBase {
  constructor(private locator: Locator) {}

  private get modalContent() { return this.locator.locator('.modal-content'); }
  private get titleElement() { return this.locator.locator('.modal-title'); }
  private get versionInfoElement() { return this.locator.locator('.version-info'); }
  private get closeButton() { return this.locator.locator('.btn-confirm'); }

  async isVisible(): Promise<boolean> {
    return await this.modalContent.isVisible();
  }

  async getTitle(): Promise<string> {
    if (await this.titleElement.isVisible()) {
      return await this.titleElement.innerText();
    }
    return '';
  }

  async getVersionInfoText(): Promise<string> {
    if (await this.versionInfoElement.isVisible()) {
      return await this.versionInfoElement.innerText();
    }
    return '';
  }

  async clickClose(): Promise<void> {
    await this.closeButton.click();
  }
}
