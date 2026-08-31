import { ComponentHarness } from "@angular/cdk/testing";

import { RacingRosterDialogHarnessBase } from "./racing-roster-dialog.harness.base";

export class RosterCardHarness extends ComponentHarness {
  static hostSelector = RacingRosterDialogHarnessBase.selectors.rosterCard;

  protected getSeedEl = this.locatorForOptional(
    RacingRosterDialogHarnessBase.selectors.seedBadge,
  );
  protected getNameEl = this.locatorForOptional(
    RacingRosterDialogHarnessBase.selectors.driverName,
  );
  protected getNickEl = this.locatorForOptional(
    RacingRosterDialogHarnessBase.selectors.driverNickname,
  );

  async getSeed(): Promise<string> {
    const el = await this.getSeedEl();
    return el ? (await el.text()).trim() : "";
  }

  async getName(): Promise<string> {
    const el = await this.getNameEl();
    return el ? (await el.text()).trim() : "";
  }

  async getNickname(): Promise<string> {
    const el = await this.getNickEl();
    return el ? (await el.text()).trim() : "";
  }
}

export class RacingRosterDialogHarness
  extends ComponentHarness
  implements RacingRosterDialogHarnessBase
{
  static hostSelector = RacingRosterDialogHarnessBase.hostSelector;

  private getBackdrop = this.locatorForOptional(
    RacingRosterDialogHarnessBase.selectors.backdrop,
  );
  private getTitle = this.locatorForOptional(
    RacingRosterDialogHarnessBase.selectors.title,
  );
  private getCountBadge = this.locatorForOptional(
    RacingRosterDialogHarnessBase.selectors.countBadge,
  );
  private getSortSeedBtn = this.locatorForOptional(
    RacingRosterDialogHarnessBase.selectors.sortSeedBtn,
  );
  private getSortNameBtn = this.locatorForOptional(
    RacingRosterDialogHarnessBase.selectors.sortNameBtn,
  );
  private getCloseBtn = this.locatorForOptional(
    RacingRosterDialogHarnessBase.selectors.closeBtn,
  );
  private getFooterCloseBtn = this.locatorForOptional(
    RacingRosterDialogHarnessBase.selectors.footerCloseBtn,
  );
  private getCards = this.locatorForAll(RosterCardHarness);
  private getEmptyMessage = this.locatorForOptional(
    RacingRosterDialogHarnessBase.selectors.emptyMessage,
  );

  async isVisible(): Promise<boolean> {
    const backdrop = await this.getBackdrop();
    return backdrop !== null;
  }

  async getTitleText(): Promise<string> {
    const title = await this.getTitle();
    return title ? (await title.text()).trim() : "";
  }

  async getCountBadgeText(): Promise<string> {
    const badge = await this.getCountBadge();
    return badge ? (await badge.text()).trim() : "";
  }

  async getItemCount(): Promise<number> {
    const cards = await this.getCards();
    return cards.length;
  }

  async getItemSeed(index: number): Promise<string> {
    const cards = await this.getCards();
    if (index >= cards.length) return "";
    return await cards[index].getSeed();
  }

  async getItemName(index: number): Promise<string> {
    const cards = await this.getCards();
    if (index >= cards.length) return "";
    return await cards[index].getName();
  }

  async getItemNickname(index: number): Promise<string> {
    const cards = await this.getCards();
    if (index >= cards.length) return "";
    return await cards[index].getNickname();
  }

  async clickSortBySeed(): Promise<void> {
    const btn = await this.getSortSeedBtn();
    if (btn) await btn.click();
  }

  async clickSortByName(): Promise<void> {
    const btn = await this.getSortNameBtn();
    if (btn) await btn.click();
  }

  async isSortBySeedActive(): Promise<boolean> {
    const btn = await this.getSortSeedBtn();
    return btn ? await btn.hasClass("active") : false;
  }

  async isSortByNameActive(): Promise<boolean> {
    const btn = await this.getSortNameBtn();
    return btn ? await btn.hasClass("active") : false;
  }

  async clickCloseButton(): Promise<void> {
    const btn = await this.getCloseBtn();
    if (btn) await btn.click();
  }

  async clickFooterCloseButton(): Promise<void> {
    const btn = await this.getFooterCloseBtn();
    if (btn) await btn.click();
  }

  async clickBackdrop(): Promise<void> {
    const backdrop = await this.getBackdrop();
    if (backdrop) await backdrop.click();
  }

  async isEmptyMessageVisible(): Promise<boolean> {
    const emptyMsg = await this.getEmptyMessage();
    return emptyMsg !== null;
  }
}
