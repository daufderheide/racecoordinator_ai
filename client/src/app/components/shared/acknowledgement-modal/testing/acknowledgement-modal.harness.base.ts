export abstract class AcknowledgementModalHarnessBase {
  static readonly hostSelector = 'app-acknowledgement-modal';

  static readonly selectors = {
    backdrop: '.modal-backdrop',
    content: '.modal-content',
    title: '.modal-title',
    message: '.modal-message',
    confirmButton: '.btn-confirm'
  };

  abstract isVisible(): Promise<boolean>;
  abstract getTitle(): Promise<string>;
  abstract getMessage(): Promise<string>;
  abstract clickAcknowledge(): Promise<void>;
  abstract getButtonText(): Promise<string>;
}
