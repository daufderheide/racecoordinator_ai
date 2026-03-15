export abstract class DefaultRacedaySetupHarnessBase {
  abstract clickRemoveAll(): Promise<void>;
  abstract clickAddAll(): Promise<void>;
  abstract clickRandomize(): Promise<void>;
  abstract isStartEnabled(): Promise<boolean>;
  abstract clickStart(): Promise<void>;
  abstract setSearchQuery(query: string): Promise<void>;
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


