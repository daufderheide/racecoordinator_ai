export abstract class EditorTabsHarnessBase {
  static readonly hostSelector = "app-editor-tabs";

  static readonly selectors = {
    container: ".editor-tabs-container",
    tab: ".editor-tab",
  };

  abstract getTabLabels(): Promise<string[]>;
  abstract getTabCount(): Promise<number>;
  abstract clickTabByIndex(index: number): Promise<void>;
  abstract clickTabByText(text: string): Promise<void>;
}
