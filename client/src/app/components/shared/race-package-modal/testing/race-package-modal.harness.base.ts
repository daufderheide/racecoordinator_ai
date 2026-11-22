export abstract class RacePackageModalHarnessBase {
  static readonly hostSelector = "app-race-package-modal";

  static readonly selectors = {
    backdrop: ".rpm-backdrop",
    dialog: ".rpm-dialog",
    header: ".rpm-header",
    title: ".rpm-title",
    subtitle: ".rpm-subtitle",
    closeBtn: ".rpm-btn-close",
    stepper: ".rpm-stepper",
    step1: ".rpm-step-item:nth-child(1)",
    step2: ".rpm-step-item:nth-child(3)",
    errorBanner: ".rpm-alert-banner.error",
    summaryCard: ".rpm-summary-card",
    raceName: ".rpm-race-name",
    duplicateCallout: ".rpm-duplicate-callout",
    duplicateSelect: ".rpm-duplicate-callout app-custom-select",
    skipBanner: ".rpm-skip-banner",
    raceNameInput: "#rpm-race-name-input",
    configCard: ".rpm-config-card",
    configActionSelect: ".rpm-config-row app-custom-select",
    seasonPicker: ".rpm-season-select",
    driversSummary: ".rpm-drivers-summary",
    toggleDriversBtn: ".btn-toggle-drivers",
    table: ".rpm-table",
    tableRows: ".rpm-table tbody tr",
    footer: ".rpm-footer",
    cancelBtn: ".rpm-footer .btn-cancel",
    secondaryBtn: ".rpm-footer .btn-secondary",
    commitBtn: ".rpm-footer .btn-commit",
  };

  abstract isVisible(): Promise<boolean>;
  abstract clickClose(): Promise<void>;
  abstract clickCancel(): Promise<void>;
  abstract clickNext(): Promise<void>;
  abstract clickCommit(): Promise<void>;
}
