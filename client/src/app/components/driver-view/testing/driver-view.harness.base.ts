export abstract class DriverViewHarnessBase {
  static readonly hostSelector = "app-driver-view";

  abstract exists(): Promise<boolean>;
}
