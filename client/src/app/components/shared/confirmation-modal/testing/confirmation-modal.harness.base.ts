export abstract class ConfirmationModalHarnessBase {
  static readonly hostSelector = 'app-confirmation-modal';

  static readonly selectors = {
    content: '.modal-content',
    title: '.modal-title',
    message: '.modal-message',
    confirmButton: '.btn-confirm',
    cancelButton: '.btn-cancel'
  };

  abstract isVisible(): Promise<boolean>;
  abstract getTitle(): Promise<string>;
  abstract getMessage(): Promise<string>;
  abstract clickConfirm(): Promise<void>;
  abstract clickCancel(): Promise<void>;
  abstract getConfirmText(): Promise<string>;
  abstract getCancelText(): Promise<string>;
}
