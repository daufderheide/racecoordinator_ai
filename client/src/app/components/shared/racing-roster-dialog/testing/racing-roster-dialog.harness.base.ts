export abstract class RacingRosterDialogHarnessBase {
  static readonly hostSelector = "app-racing-roster-dialog";

  static readonly selectors = {
    backdrop: ".roster-backdrop",
    container: ".roster-dialog-container",
    title: ".modal-header h2",
    countBadge: ".count-badge",
    sortSeedBtn: '[data-testid="sort-seed-btn"]',
    sortNameBtn: '[data-testid="sort-name-btn"]',
    closeBtn: ".close-btn",
    footerCloseBtn: ".modal-footer .btn-close",
    rosterGrid: ".roster-grid",
    rosterCard: ".roster-card",
    seedBadge: ".seed-badge",
    driverName: ".driver-name",
    driverNickname: ".driver-nickname",
    emptyMessage: ".empty-roster-message",
  };

  abstract isVisible(): Promise<boolean>;
  abstract getTitleText(): Promise<string>;
  abstract getCountBadgeText(): Promise<string>;
  abstract getItemCount(): Promise<number>;
  abstract getItemSeed(index: number): Promise<string>;
  abstract getItemName(index: number): Promise<string>;
  abstract getItemNickname(index: number): Promise<string>;
  abstract clickSortBySeed(): Promise<void>;
  abstract clickSortByName(): Promise<void>;
  abstract isSortBySeedActive(): Promise<boolean>;
  abstract isSortByNameActive(): Promise<boolean>;
  abstract clickCloseButton(): Promise<void>;
  abstract clickFooterCloseButton(): Promise<void>;
  abstract clickBackdrop(): Promise<void>;
  abstract isEmptyMessageVisible(): Promise<boolean>;
}
