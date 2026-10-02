export abstract class ModifyHeatsModalHarnessBase {
  static readonly hostSelector = "app-modify-heats-modal";

  static readonly selectors = {
    driverItem: ".driver-item",
    heatCard: ".heat-card",
    lockedOverlay: ".locked-overlay",
    databaseDrivers: "#database-drivers",
    driverPool: "#driver-pool",
    heatGrid: ".heats-grid",
    driverName: ".driver-name",
    undoBtn: "#undo-btn",
    redoBtn: "#redo-btn",
    loaderOverlay: ".loader-overlay",
    laneCheckBtn: "#lane-check-btn",
    equalityReportModal: ".equality-report-modal",
  };

  abstract getDriverItemCount(): Promise<number>;
  abstract getHeatCardCount(): Promise<number>;
  abstract getLockedOverlayCount(): Promise<number>;
  abstract isDriverVisibleInDatabase(name: string): Promise<boolean>;
  abstract isDriverVisibleInPool(name: string): Promise<boolean>;
  abstract clickUndo(): Promise<void>;
  abstract clickRedo(): Promise<void>;
  abstract clickLaneCheck(): Promise<void>;
  abstract isEqualityReportVisible(): Promise<boolean>;
  abstract waitForLoaderToBeHidden(): Promise<void>;
  abstract dragDriverToHeat(
    driverName: string,
    heatIndex: number,
  ): Promise<void>;
}
