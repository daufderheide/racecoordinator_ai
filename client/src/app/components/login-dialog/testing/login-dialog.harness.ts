import { ComponentHarness } from "@angular/cdk/testing";

import { LoginDialogHarnessBase } from "./login-dialog.harness.base";

export class LoginDialogHarness
  extends ComponentHarness
  implements LoginDialogHarnessBase
{
  static hostSelector = LoginDialogHarnessBase.hostSelector;

  protected getBackdrop = this.locatorForOptional(
    LoginDialogHarnessBase.selectors.backdrop,
  );
  protected getPasswordInput = this.locatorFor(
    LoginDialogHarnessBase.selectors.passwordInput,
  );
  protected getCancelButton = this.locatorFor(
    LoginDialogHarnessBase.selectors.cancelButton,
  );
  protected getConfirmButton = this.locatorFor(
    LoginDialogHarnessBase.selectors.confirmButton,
  );

  async isVisible(): Promise<boolean> {
    const backdrop = await this.getBackdrop();
    return backdrop !== null;
  }

  async enterPassword(password: string): Promise<void> {
    const input = await this.getPasswordInput();
    await input.clear();
    await input.sendKeys(password);
  }

  async clickCancel(): Promise<void> {
    const btn = await this.getCancelButton();
    await btn.click();
  }

  async clickLogin(): Promise<void> {
    const btn = await this.getConfirmButton();
    await btn.click();
  }
}
