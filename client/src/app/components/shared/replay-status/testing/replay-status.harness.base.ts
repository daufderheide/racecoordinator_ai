export abstract class ReplayStatusHarnessBase {
  static readonly hostSelector = "app-replay-status";

  static readonly selectors = {
    container: ".replay-status-container",
    statusBadge: ".status-badge",
    progressBar: ".progress-bar-fill",
    logTime: ".log-time",
  };

  abstract isVisible(): Promise<boolean>;
  abstract getStatusText(): Promise<string>;
}
