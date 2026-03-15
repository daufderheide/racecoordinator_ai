export abstract class ConfirmationModalHarnessBase {
  abstract isVisible(): Promise<boolean>;
  abstract getTitle(): Promise<string>;
  abstract getMessage(): Promise<string>;
  abstract clickConfirm(): Promise<void>;
  abstract clickCancel(): Promise<void>;
  abstract getConfirmText(): Promise<string>;
  abstract getCancelText(): Promise<string>;
}
