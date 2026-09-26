export abstract class CameraInterfaceHarnessBase {
  static readonly hostSelector = "app-camera-interface";

  static readonly selectors = {
    backBtn: "#cameraHudBackBtn",
    statusPill: ".status-pill",
    statusText: ".status-pill .status-text",
    fpsMetric: ".hud-center .metric-pill:nth-child(1)",
    batteryMetric: ".hud-center .metric-pill:nth-child(2)",
    doneBtn: "#cameraModalDoneBtn",
    autoSnapBtn: "#cameraAutoSnapBtn",
    saveGatesBtn: "#cameraSaveGatesBtn",
    savedToast: "#cameraSavedToast",
    flipBtn: "#cameraFlipBtn",
    settingsBtn: "#cameraSettingsBtn",
    settingsCard: ".settings-card",
    settingsCloseBtn: ".settings-card .close-btn",
    settingsDoneBtn: ".settings-card .card-footer button",
    autoSnapCard: ".auto-snap-card",
    autoSnapCancelBtn: "#btnCancelAutoSnap, #btnCancelAutoSnapCar",
    autoSnapSkipBtn: "#btnSkipLane",
    autoSplitBtn: "#btnAutoSplit",
    calibrateCarBtn: "#btnCalibrateCar",
    splitRowsBtn: "#btnSplitRows",
    splitColsBtn: "#btnSplitCols",
    finishLineZoneGroup: ".finish-line-zone-group",
    finishLineZoneRect: ".finish-line-zone-rect",
    autoSnapTitle: ".auto-snap-card h3",
    cameraErrorCard: ".camera-error-card",
    cameraErrorRetryBtn: ".camera-error-card .btn-primary",
    cameraErrorLearnMoreBtn: "#cameraErrorLearnMoreBtn",
    gateGroups: ".gate-group",
    gateRects: ".gate-rect",
    gateLabels: ".gate-label",
  };

  abstract isBackVisible(): Promise<boolean>;
  abstract clickBack(): Promise<void>;
  abstract isDoneVisible(): Promise<boolean>;
  abstract clickDone(): Promise<void>;
  abstract isConnected(): Promise<boolean>;
  abstract getStatusText(): Promise<string>;
  abstract getFpsText(): Promise<string>;
  abstract getBatteryText(): Promise<string>;
  abstract isAutoSnapVisible(): Promise<boolean>;
  abstract clickAutoSnap(): Promise<void>;
  abstract isSaveGatesVisible(): Promise<boolean>;
  abstract clickSaveGates(): Promise<void>;
  abstract isSavedToastVisible(): Promise<boolean>;
  abstract isAutoSnapOpen(): Promise<boolean>;
  abstract isFinishLineZoneVisible(): Promise<boolean>;
  abstract clickAutoSplit(): Promise<void>;
  abstract clickCalibrateCar(): Promise<void>;
  abstract clickSplitRows(): Promise<void>;
  abstract clickSplitCols(): Promise<void>;
  abstract isSplitRowsSelected(): Promise<boolean>;
  abstract isSplitColsSelected(): Promise<boolean>;
  abstract clickAutoSnapCancel(): Promise<void>;
  abstract clickAutoSnapSkip(): Promise<void>;
  abstract isFlipVisible(): Promise<boolean>;
  abstract clickFlip(): Promise<void>;
  abstract isSettingsVisible(): Promise<boolean>;
  abstract clickSettings(): Promise<void>;
  abstract isSettingsOpen(): Promise<boolean>;
  abstract closeSettings(): Promise<void>;
  abstract isErrorVisible(): Promise<boolean>;
  abstract clickErrorRetry(): Promise<void>;
  abstract clickErrorLearnMore(): Promise<void>;
  abstract getGateCount(): Promise<number>;
}
