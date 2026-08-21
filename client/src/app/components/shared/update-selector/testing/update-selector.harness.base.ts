export abstract class UpdateSelectorHarnessBase {
  static readonly hostSelector = "app-update-selector";

  static readonly selectors = {
    trigger: '[data-testid="menu-item-automatic-updates"]',
    dropdown: '[data-testid="submenu-automatic-updates"]',
    checkUpdates: '[data-testid="item-check-updates"]',
    channelAlpha: '[data-testid="channel-alpha"]',
    channelBeta: '[data-testid="channel-beta"]',
    channelProduction: '[data-testid="channel-production"]',
    channelDisabled: '[data-testid="channel-disabled"]',
  };

  abstract isDropdownOpen(): Promise<boolean>;
}
