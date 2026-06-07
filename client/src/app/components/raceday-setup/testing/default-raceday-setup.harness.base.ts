export abstract class DefaultRacedaySetupHarnessBase {
  static readonly hostSelector = "app-default-raceday-setup";

  static readonly selectors = {
    driverItem: ".driver-item",
    driverName: ".driver-name",
    menuDropdown: ".setup-menu-dropdown, .menu-dropdown",
    menuDropdownItem: ".setup-menu-dropdown-item, .menu-dropdown-item",
    removeAllBtn: '[data-testid="btn-remove-all"]',
    startBtn: ".btn-start",
    raceCard: ".race-card",
    dropdownTrigger: ".dropdown-trigger",
    optionsMenu: ".options-menu-container .setup-menu-item",
    fileMenu: ".file-menu-container .setup-menu-item",
    configMenu: ".config-menu-container .setup-menu-item",
    helpMenu: ".help-menu-container .setup-menu-item",
    driverActionBarBtn: ".header-actions .action-btn",
  };

  abstract clickRemoveAll(): Promise<void>;
  abstract clickAddAll(): Promise<void>;
  abstract clickRandomize(): Promise<void>;
  abstract isStartEnabled(): Promise<boolean>;
  abstract clickStart(): Promise<void>;

  abstract getUnselectedDriverCount(): Promise<number>;
  abstract getSelectedDriverCount(): Promise<number>;
  abstract getUnselectedDriverName(index: number): Promise<string>;
  abstract doubleClickUnselectedDriver(index: number): Promise<void>;
  abstract getRaceCardCount(): Promise<number>;
  abstract clickRaceDropdown(): Promise<void>;
  abstract openOptionsMenu(): Promise<void>;
  abstract clickOptionsMenuOptionByText(text: string): Promise<void>;
  abstract openFileMenu(): Promise<void>;
  abstract openConfigMenu(): Promise<void>;
  abstract openHelpMenu(): Promise<void>;
  abstract isMenuDropdownVisible(menuClass: string): Promise<boolean>;
}
