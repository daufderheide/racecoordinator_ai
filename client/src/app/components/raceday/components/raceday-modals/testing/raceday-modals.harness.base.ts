export abstract class RacedayModalsHarnessBase {
  static readonly hostSelector = "app-raceday-modals";

  static readonly selectors = {
    ackModal: "app-acknowledgement-modal",
    exitModal: "app-confirmation-modal:nth-of-type(1)",
    skipHeatModal: "app-confirmation-modal:nth-of-type(2)",
    skipRaceModal: "app-confirmation-modal:nth-of-type(3)",
    restartHeatModal: "app-confirmation-modal:nth-of-type(4)",
    deferHeatModal: "app-confirmation-modal:nth-of-type(5)",
  };

  abstract isAckModalVisible(): Promise<boolean>;
  abstract isExitModalVisible(): Promise<boolean>;
  abstract isSkipHeatModalVisible(): Promise<boolean>;
  abstract isSkipRaceModalVisible(): Promise<boolean>;
  abstract isRestartHeatModalVisible(): Promise<boolean>;
  abstract isDeferHeatModalVisible(): Promise<boolean>;
}
