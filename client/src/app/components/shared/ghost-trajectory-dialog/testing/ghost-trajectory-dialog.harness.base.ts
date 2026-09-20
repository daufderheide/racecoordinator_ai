export abstract class GhostTrajectoryDialogHarnessBase {
  static readonly hostSelector = "app-ghost-trajectory-dialog";

  static readonly selectors = {
    backdrop: ".trajectory-modal-backdrop",
    container: ".trajectory-modal-container",
    closeBtn: ".close-btn",
    driverAName: ".driver-a .driver-name",
    driverBName: ".driver-b .driver-name",
    metricCards: ".metric-card",
  };

  abstract isVisible(): Promise<boolean>;
  abstract dismiss(): Promise<void>;
  abstract getDriverAName(): Promise<string>;
  abstract getMetricCardCount(): Promise<number>;
}
