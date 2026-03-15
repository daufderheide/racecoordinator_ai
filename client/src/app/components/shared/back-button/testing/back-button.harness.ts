import { ComponentHarness } from '@angular/cdk/testing';
import { BackButtonHarnessBase } from './back-button.harness.base';

export class BackButtonHarness extends ComponentHarness implements BackButtonHarnessBase {
  static hostSelector = BackButtonHarnessBase.hostSelector;

  protected getButton = this.locatorFor(BackButtonHarnessBase.selectors.button);
  protected getConfirmModalConfirmButton = () => document.querySelector(BackButtonHarnessBase.selectors.confirmModalConfirm) as HTMLElement | null;
  protected getConfirmModalCancelButton = () => document.querySelector(BackButtonHarnessBase.selectors.confirmModalCancel) as HTMLElement | null;

  async click(): Promise<void> {
    const btn = await this.getButton();
    await btn.click();
  }

  async getLabel(): Promise<string> {
    const btn = await this.getButton();
    const text = await btn.text();
    // remove the back arrow `<` or whatever from the text
    return text.replace(/[‹\s]/g, '').trim();
  }

  async clickModalConfirm(): Promise<void> {
    const btn = this.getConfirmModalConfirmButton();
    if (btn) btn.click();
    else throw new Error('Confirmation modal confirm button not found');
  }

  async clickModalCancel(): Promise<void> {
    const btn = this.getConfirmModalCancelButton();
    if (btn) btn.click();
    else throw new Error('Confirmation modal cancel button not found');
  }
}
