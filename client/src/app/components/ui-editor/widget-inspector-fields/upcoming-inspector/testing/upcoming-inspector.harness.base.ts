export abstract class UpcomingInspectorHarnessBase {
  static readonly hostSelector = "app-upcoming-inspector";

  static readonly selectors = {
    container: ".upcoming-inspector",
  };

  abstract exists(): Promise<boolean>;
}
