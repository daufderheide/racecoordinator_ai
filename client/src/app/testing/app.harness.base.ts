export abstract class AppHarnessBase {
  static readonly hostSelector = "app-root";

  static readonly selectors = {
    routeContainer: ".app-route-container",
  };

  abstract exists(): Promise<boolean>;
}
