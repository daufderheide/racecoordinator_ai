export abstract class ActionButtonInspectorHarnessBase {
  static readonly hostSelector = "app-action-button-inspector";

  static readonly selectors = {
    container: ".action-button-inspector",
  };

  abstract exists(): Promise<boolean>;
}
