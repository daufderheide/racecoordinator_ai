export abstract class LoginDialogHarnessBase {
  static readonly hostSelector = "app-login-dialog";

  static readonly selectors = {
    backdrop: ".modal-backdrop",
    passwordInput: ".form-input",
    errorMessage: ".error-message",
    cancelButton: ".btn-cancel",
    confirmButton: ".btn-confirm",
  };

  abstract isVisible(): Promise<boolean>;
  abstract enterPassword(password: string): Promise<void>;
  abstract clickCancel(): Promise<void>;
  abstract clickLogin(): Promise<void>;
}
