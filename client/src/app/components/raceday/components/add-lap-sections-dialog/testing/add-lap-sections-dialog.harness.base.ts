export abstract class AddLapSectionsDialogHarnessBase {
  static readonly hostSelector = "app-add-lap-sections-dialog";

  static readonly selectors = {
    backdrop: ".modal-backdrop",
    content: ".modal-content",
    closeBtn: ".btn-cancel",
  };

  abstract isVisible(): Promise<boolean>;
  abstract clickCancel(): Promise<void>;
}
