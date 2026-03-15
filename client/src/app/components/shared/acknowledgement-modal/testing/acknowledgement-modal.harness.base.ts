export abstract class AcknowledgementModalHarnessBase {
  abstract isVisible(): Promise<boolean>;
  abstract getTitle(): Promise<string>;
  abstract getMessage(): Promise<string>;
  abstract clickAcknowledge(): Promise<void>;
  abstract getButtonText(): Promise<string>;
}
