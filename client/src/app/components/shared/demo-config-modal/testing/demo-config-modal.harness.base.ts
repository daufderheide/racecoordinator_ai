export abstract class DemoConfigModalHarnessBase {
  static readonly hostSelector = "app-demo-config-modal";

  static readonly selectors = {
    overlay: ".modal-overlay",
    content: ".demo-config-modal",
    closeButton: ".close-btn",
  };

  abstract isVisible(): Promise<boolean>;
  abstract clickClose(): Promise<void>;
}
