import { ComponentHarness } from '@angular/cdk/testing';

import { InputDialogHarnessBase } from './input-dialog.harness.base';

export class InputDialogHarness extends ComponentHarness implements InputDialogHarnessBase {
  static hostSelector = InputDialogHarnessBase.hostSelector;

  protected getModalContent = this.locatorForOptional(InputDialogHarnessBase.selectors.content);
  protected getTitleElement = this.locatorForOptional(InputDialogHarnessBase.selectors.title);
  protected getMessageElement = this.locatorForOptional(InputDialogHarnessBase.selectors.message);
  protected getInputElement = this.locatorForOptional(InputDialogHarnessBase.selectors.input);
  protected getConfirmButton = this.locatorForOptional(InputDialogHarnessBase.selectors.confirmButton);
  protected getCancelButton = this.locatorForOptional(InputDialogHarnessBase.selectors.cancelButton);

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

  async getInputValue(): Promise<string> {
    const el = await this.getInputElement();
    return el ? await el.getProperty('value') : '';
  }

  async setInputValue(value: string | number): Promise<void> {
    const el = await this.getInputElement();
    if (el) await el.setInputValue(value.toString());
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

  async isConfirmDisabled(): Promise<boolean> {
    const el = await this.getConfirmButton();
    return el ? await el.getProperty('disabled') : true;
  }
}
