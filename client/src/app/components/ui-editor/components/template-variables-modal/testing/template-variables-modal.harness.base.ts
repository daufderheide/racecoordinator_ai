export abstract class TemplateVariablesModalHarnessBase {
  static readonly hostSelector = "app-template-variables-modal";

  static readonly selectors = {
    overlay: ".modal-overlay",
    dialog: ".modal-dialog",
    closeBtn: ".icon-btn",
    searchInput: ".search-input",
    clearSearchBtn: ".clear-search-btn",
    categoryTabs: ".category-tab",
    variableCards: ".variable-card",
  };

  abstract isVisible(): Promise<boolean>;
  abstract close(): Promise<void>;
  abstract search(query: string): Promise<void>;
  abstract getSearchValue(): Promise<string>;
  abstract getVariableCardCount(): Promise<number>;
  abstract getCategoryTabCount(): Promise<number>;
}
