export abstract class EventEditorHarnessBase {
  static readonly hostSelector = "app-event-editor";

  static readonly selectors = {
    container: ".event-editor-container",
  };

  abstract exists(): Promise<boolean>;
}
