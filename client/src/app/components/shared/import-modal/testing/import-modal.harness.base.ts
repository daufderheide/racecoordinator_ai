export abstract class ImportModalHarnessBase {
  static readonly hostSelector = "app-import-modal";

  static readonly selectors = {
    backdrop: "#import-modal-backdrop",
    dialog: "#import-modal-dialog",
    header: ".modal-header",
    title: ".modal-title",
    closeBtn: ".btn-ghost-close",
    uploadStep: "#import-upload-step",
    dropzone: "#import-dropzone",
    fileInput: "#import-dropzone input[type='file']",
    fileChip: ".file-chip",
    validateBtn: "#btn-validate-preview",
    previewStep: "#import-preview-step",
    validPill: ".pill-valid",
    conflictPill: ".pill-conflict",
    errorPill: ".pill-error",
    assetsPill: "#pill-assets-badge",
    previewTable: ".preview-table",
    tableRows: ".preview-table tbody tr",
    nameInputs: ".col-name input",
    nickInputs: ".col-nick input",
    commitBtn: "#btn-commit-import",
    assetsDialog: "#assets-dialog-card",
    summaryStep: "#import-summary-step",
    doneBtn: "#btn-done-import",
  };

  abstract isVisible(): Promise<boolean>;
  abstract getTitle(): Promise<string>;
  abstract clickClose(): Promise<void>;
}
