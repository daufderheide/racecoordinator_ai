export abstract class DisallowLapRecordsDialogHarnessBase {
  static readonly hostSelector = "app-disallow-lap-records-dialog";

  static readonly selectors = {
    backdrop: ".disallow-records-backdrop",
    container: ".disallow-records-container",
    closeBtn: ".close-btn",
    raceName: ".race-name-text",
    lapRows: ".dlr-table-row",
    emptyState: ".dlr-empty-state",
  };

  abstract isVisible(): Promise<boolean>;
  abstract dismiss(): Promise<void>;
  abstract getRaceName(): Promise<string>;
  abstract getLapRowsCount(): Promise<number>;
}
