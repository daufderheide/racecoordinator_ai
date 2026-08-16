export abstract class LanguageSelectorHarnessBase {
  static readonly hostSelector = "app-language-selector";

  static readonly selectors = {
    trigger: ".language-trigger",
    dropdown: ".language-dropdown",
  };

  abstract isDropdownOpen(): Promise<boolean>;
}
