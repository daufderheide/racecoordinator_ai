import { Locator } from "@playwright/test";

import { RacingRosterDialogHarnessBase } from "./racing-roster-dialog.harness.base";

export class RacingRosterDialogHarnessE2e implements RacingRosterDialogHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacingRosterDialogHarnessBase;
  }

  private get backdrop() {
    return this.locator.locator(this.base.selectors.backdrop);
  }
  private get title() {
    return this.locator.locator(this.base.selectors.title);
  }
  private get countBadge() {
    return this.locator.locator(this.base.selectors.countBadge);
  }
  private get sortSeedBtn() {
    return this.locator.locator(this.base.selectors.sortSeedBtn);
  }
  private get sortNameBtn() {
    return this.locator.locator(this.base.selectors.sortNameBtn);
  }
  private get closeBtn() {
    return this.locator.locator(this.base.selectors.closeBtn);
  }
  private get footerCloseBtn() {
    return this.locator.locator(this.base.selectors.footerCloseBtn);
  }
  private get cards() {
    return this.locator.locator(this.base.selectors.rosterCard);
  }
  private get emptyMessage() {
    return this.locator.locator(this.base.selectors.emptyMessage);
  }

  async isVisible(): Promise<boolean> {
    return (
      (await this.backdrop.count()) > 0 && (await this.backdrop.isVisible())
    );
  }

  async getTitleText(): Promise<string> {
    return (await this.title.textContent())?.trim() || "";
  }

  async getCountBadgeText(): Promise<string> {
    return (await this.countBadge.textContent())?.trim() || "";
  }

  async getItemCount(): Promise<number> {
    return await this.cards.count();
  }

  async getItemSeed(index: number): Promise<string> {
    const card = this.cards.nth(index);
    return (
      (
        await card.locator(this.base.selectors.seedBadge).textContent()
      )?.trim() || ""
    );
  }

  async getItemName(index: number): Promise<string> {
    const card = this.cards.nth(index);
    return (
      (
        await card.locator(this.base.selectors.driverName).textContent()
      )?.trim() || ""
    );
  }

  async getItemNickname(index: number): Promise<string> {
    const card = this.cards.nth(index);
    return (
      (
        await card.locator(this.base.selectors.driverNickname).textContent()
      )?.trim() || ""
    );
  }

  async clickSortBySeed(): Promise<void> {
    await this.sortSeedBtn.click();
  }

  async clickSortByName(): Promise<void> {
    await this.sortNameBtn.click();
  }

  async isSortBySeedActive(): Promise<boolean> {
    const classAttr = (await this.sortSeedBtn.getAttribute("class")) || "";
    return classAttr.includes("active");
  }

  async isSortByNameActive(): Promise<boolean> {
    const classAttr = (await this.sortNameBtn.getAttribute("class")) || "";
    return classAttr.includes("active");
  }

  async clickCloseButton(): Promise<void> {
    await this.closeBtn.click();
  }

  async clickFooterCloseButton(): Promise<void> {
    await this.footerCloseBtn.click();
  }

  async clickBackdrop(): Promise<void> {
    await this.backdrop.click({ position: { x: 5, y: 5 } });
  }

  async isEmptyMessageVisible(): Promise<boolean> {
    return (
      (await this.emptyMessage.count()) > 0 &&
      (await this.emptyMessage.isVisible())
    );
  }
}
