export abstract class TwinGraphsHarnessBase {
  static readonly hostSelector = "app-twin-graphs";

  static readonly selectors = {
    container: ".twin-graphs-container",
  };

  abstract exists(): Promise<boolean>;
}
