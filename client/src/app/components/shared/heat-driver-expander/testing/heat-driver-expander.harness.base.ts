export abstract class HeatDriverExpanderHarnessBase {
  static readonly hostSelector = "app-heat-driver-expander";

  static readonly selectors = {
    container: ".expander-container",
  };

  abstract exists(): Promise<boolean>;
}
