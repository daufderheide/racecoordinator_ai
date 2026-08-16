import { Locator } from "@playwright/test";

import { LoginDialogHarnessBase } from "./login-dialog.harness.base";

export class LoginDialogHarnessE2e implements LoginDialogHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return LoginDialogHarnessBase;
  }

  private get backdrop() {
    return this.locator.locator(this.base.selectors.backdrop);
  }

  private get passwordInput() {
    return this.locator.locator(this.base.selectors.passwordInput);
  }

  private get cancelButton() {
    return this.locator.locator(this.base.selectors.cancelButton);
  }

  private get confirmButton() {
    return this.locator.locator(this.base.selectors.confirmButton);
  }

  async isVisible(): Promise<boolean> {
    return await this.backdrop.isVisible();
  }

  async enterPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  async clickCancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async clickLogin(): Promise<void> {
    await this.confirmButton.click();
  }
}
