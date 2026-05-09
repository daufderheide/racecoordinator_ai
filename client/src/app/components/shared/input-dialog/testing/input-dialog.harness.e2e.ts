import { Locator } from '@playwright/test';

import { InputDialogHarnessBase } from './input-dialog.harness.base';

export class InputDialogHarnessE2e implements InputDialogHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return InputDialogHarnessBase; }

  private get modalContent() { return this.locator.locator(this.base.selectors.content); }
  private get titleElement() { return this.locator.locator(this.base.selectors.title); }
  private get messageElement() { return this.locator.locator(this.base.selectors.message); }
  private get inputElement() { return this.locator.locator(this.base.selectors.input); }
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

  async getInputValue(): Promise<string> {
    return await this.inputElement.inputValue();
  }

  async setInputValue(value: string | number): Promise<void> {
    await this.inputElement.fill(value.toString());
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

  async isConfirmDisabled(): Promise<boolean> {
    return await this.confirmButton.isDisabled();
  }
}
