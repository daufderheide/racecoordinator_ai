export abstract class CustomSelectHarnessBase {
  static readonly hostSelector = "app-custom-select";

  static readonly selectors = {
    trigger: ".custom-select-trigger",
    dropdown: ".custom-select-dropdown",
    option: ".custom-select-option",
    selectedOption: ".custom-select-option.selected",
    disabledOption: ".custom-select-option.disabled",
  };

  /** Checks if the dropdown is open and visible */
  abstract isOpen(): Promise<boolean>;

  /** Toggles the dropdown open/close state */
  abstract toggle(): Promise<void>;

  /** Gets the number of options displayed in the dropdown */
  abstract getOptionsCount(): Promise<number>;

  /** Gets the text content of the option at the specified index */
  abstract getOptionText(index: number): Promise<string>;

  /** Clicks the option at the specified index */
  abstract clickOption(index: number): Promise<void>;

  /** Clicks the option with the specified data-value */
  abstract selectOptionByValue(value: string): Promise<void>;
}
