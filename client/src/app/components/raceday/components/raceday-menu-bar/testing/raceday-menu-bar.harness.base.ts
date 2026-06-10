export abstract class RacedayMenuBarHarnessBase {
  static readonly hostSelector = "app-raceday-menu-bar";

  static readonly selectors = {
    menuButton: ".menu-button-top",
    dropdown: ".menu-dropdown",
    menuItem: ".menu-item",
  };

  abstract clickMenuButton(label: string): Promise<void>;
  abstract clickMenuItem(label: string): Promise<void>;
  abstract isMenuOpen(
    menuType: "file" | "race" | "lanes" | "windows" | "options",
  ): Promise<boolean>;
}
