export abstract class WidgetInspectorFieldsHarnessBase {
  static readonly hostSelector = "app-widget-inspector-fields";

  static readonly selectors = {
    container: ".widget-inspector-fields",
  };

  abstract exists(): Promise<boolean>;
}
