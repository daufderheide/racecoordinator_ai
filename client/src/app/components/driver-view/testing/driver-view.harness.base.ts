export abstract class DriverViewHarnessBase {
  static readonly hostSelector = "app-driver-view";

  static readonly selectors = {
    container: ".driver-view-container",
    nav: ".driver-view-nav",
    driverStation: "app-driver-station",
    onDeckContainer: ".on-deck-mobile-container",
    heatDrivers: "app-raceday-heat-drivers",
    ackModal: "app-acknowledgement-modal",
  };

  abstract exists(): Promise<boolean>;
  abstract isRacingMode(): Promise<boolean>;
  abstract isOnDeckMode(): Promise<boolean>;
}
