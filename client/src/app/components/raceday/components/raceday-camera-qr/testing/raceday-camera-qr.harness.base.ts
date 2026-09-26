export abstract class RacedayCameraQrHarnessBase {
  static readonly hostSelector = "app-raceday-camera-qr";

  static readonly selectors = {
    card: ".camera-qr-card",
    qrImg: ".camera-qr-img",
    badge: ".camera-icon-badge",
    modal: ".camera-qr-modal",
    modalQrImg: ".modal-qr-img",
    modalInput: ".modal-link-input",
    copyBtn: ".btn-copy",
    testBtn: ".btn-test",
    closeBtn: ".close-btn",
  };

  abstract getQrCodeSrc(): Promise<string | null>;
  abstract isModalOpen(): Promise<boolean>;
  abstract clickCard(): Promise<void>;
  abstract clickClose(): Promise<void>;
  abstract getModalInputUrl(): Promise<string | null>;
  abstract clickCopy(): Promise<void>;
  abstract clickTest(): Promise<void>;
}
