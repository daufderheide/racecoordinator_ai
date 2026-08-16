export abstract class DefaultDriverStationHarnessBase {
  static readonly hostSelector = "app-default-driver-station";

  abstract exists(): Promise<boolean>;
}
