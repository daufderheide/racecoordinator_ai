export abstract class DriverExportModalHarnessBase {
  static readonly hostSelector = "app-driver-export-modal";

  static readonly selectors = {
    backdrop: "#driver-export-modal-backdrop",
    dialog: "#driver-export-modal-dialog",
    header: ".modal-header",
    title: ".modal-title",
    closeBtn: ".btn-ghost-close",
    errorBanner: "#driver-export-error-banner",
    overviewCard: ".export-overview-card",
    driverCountBadge: ".driver-count-badge",
    countText: ".count-text",
    formatSection: ".format-selection-section",
    formatCardCsv: "#driver-export-format-csv",
    formatCardXlsx: "#driver-export-format-xlsx",
    formatCardJson: "#driver-export-format-json",
    cancelBtn: "#btn-driver-export-cancel",
    confirmBtn: "#btn-driver-export-confirm",
  };

  abstract isVisible(): Promise<boolean>;
  abstract clickClose(): Promise<void>;
  abstract clickCancel(): Promise<void>;
  abstract clickConfirm(): Promise<void>;
  abstract selectFormat(format: "csv" | "xlsx" | "json"): Promise<void>;
}
