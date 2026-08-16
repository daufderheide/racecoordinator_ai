export abstract class MenuInspectorHarnessBase {
  static readonly hostSelector = "app-menu-inspector";

  static readonly selectors = {
    container: ".menu-inspector",
  };

  abstract exists(): Promise<boolean>;
}
