export abstract class InputDialogHarnessBase {
  static readonly hostSelector = 'app-input-dialog';

  static readonly selectors = {
    content: '.modal-content',
    title: '.modal-title',
    message: '.modal-message',
    input: 'input',
    confirmButton: '.btn-confirm',
    cancelButton: '.btn-cancel'
  };

  abstract isVisible(): Promise<boolean>;
  abstract getTitle(): Promise<string>;
  abstract getMessage(): Promise<string>;
  abstract getInputValue(): Promise<string>;
  abstract setInputValue(value: string | number): Promise<void>;
  abstract clickConfirm(): Promise<void>;
  abstract clickCancel(): Promise<void>;
  abstract getConfirmText(): Promise<string>;
  abstract getCancelText(): Promise<string>;
  abstract isConfirmDisabled(): Promise<boolean>;
}
