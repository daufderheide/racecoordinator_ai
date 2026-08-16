export abstract class LockOverlayHarnessBase {
  static readonly hostSelector = "app-lock-overlay";

  static readonly selectors = {
    overlay: ".overlay",
    dialog: ".dialog",
    dismissButton: ".btn-dismiss",
  };

  abstract isLocked(): Promise<boolean>;
  abstract clickDismiss(): Promise<void>;
}
