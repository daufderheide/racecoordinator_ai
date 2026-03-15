import { ComponentHarness } from '@angular/cdk/testing';
import { AcknowledgementModalHarnessBase } from './acknowledgement-modal.harness.base';

export class AcknowledgementModalHarness extends ComponentHarness implements AcknowledgementModalHarnessBase {
  static hostSelector = AcknowledgementModalHarnessBase.hostSelector;

  protected getModalContent = this.locatorForOptional(AcknowledgementModalHarnessBase.selectors.content);
  protected getTitleElement = this.locatorForOptional(AcknowledgementModalHarnessBase.selectors.title);
  protected getMessageElement = this.locatorForOptional(AcknowledgementModalHarnessBase.selectors.message);
  protected getConfirmButton = this.locatorForOptional(AcknowledgementModalHarnessBase.selectors.confirmButton);

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

  async clickAcknowledge(): Promise<void> {
    const btn = await this.getConfirmButton();
    if (btn) await btn.click();
  }

  async getButtonText(): Promise<string> {
    const el = await this.getConfirmButton();
    return el ? await el.text() : '';
  }
}
