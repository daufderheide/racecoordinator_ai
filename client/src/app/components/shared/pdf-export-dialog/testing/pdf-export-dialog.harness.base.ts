export abstract class PdfExportDialogHarnessBase {
  static readonly hostSelector = "app-pdf-export-dialog";

  static readonly selectors = {
    backdrop: "#pdf-export-modal-backdrop",
    content: "#pdf-export-modal-content",
    includeBackgroundCheckbox: "#pdf-include-background-checkbox",
    saveDefaultCheckbox: "#pdf-save-default-checkbox",
    cancelButton: ".btn-cancel",
    exportButton: ".btn-confirm",
  };

  abstract isVisible(): Promise<boolean>;
  abstract clickCancel(): Promise<void>;
  abstract clickExport(): Promise<void>;
}
