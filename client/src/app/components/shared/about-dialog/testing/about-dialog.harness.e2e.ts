import { Locator } from "@playwright/test";

import { AboutDialogHarnessBase } from "./about-dialog.harness.base";

export class AboutDialogHarnessE2e implements AboutDialogHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return AboutDialogHarnessBase;
  }

  private get modalContent() {
    return this.locator.locator(this.base.selectors.content);
  }
  private get titleElement() {
    return this.locator.locator(this.base.selectors.title);
  }
  private get versionInfoElement() {
    return this.locator.locator(this.base.selectors.versionInfo);
  }
  private get charityInfoElement() {
    return this.locator.locator(this.base.selectors.charityInfo);
  }
  private get donateLinkElement() {
    return this.locator.locator(this.base.selectors.donateLink);
  }
  private get creditsPanelElement() {
    return this.locator.locator(this.base.selectors.creditsPanel);
  }
  private get creditNamesElements() {
    return this.locator.locator(this.base.selectors.creditNames);
  }
  private get tabButtons() {
    return this.locator.locator(this.base.selectors.tabButtons);
  }
  private get closeButton() {
    return this.locator.locator(this.base.selectors.closeButton);
  }

  async isVisible(): Promise<boolean> {
    return await this.modalContent.isVisible();
  }

  async getTitle(): Promise<string> {
    if (await this.titleElement.isVisible()) {
      return await this.titleElement.innerText();
    }
    return "";
  }

  async getVersionInfoText(): Promise<string> {
    if (await this.versionInfoElement.isVisible()) {
      return await this.versionInfoElement.innerText();
    }
    return "";
  }

  async clickClose(): Promise<void> {
    await this.closeButton.click();
  }

  async clickTab(index: number): Promise<void> {
    await this.tabButtons.nth(index).click();
  }

  async isCharityTabVisible(): Promise<boolean> {
    return await this.charityInfoElement.isVisible();
  }

  async getDonateLinkHref(): Promise<string | null> {
    if (await this.donateLinkElement.isVisible()) {
      return await this.donateLinkElement.getAttribute("href");
    }
    return null;
  }

  async isCreditsTabVisible(): Promise<boolean> {
    return await this.creditsPanelElement.isVisible();
  }

  async getCreditNames(): Promise<string[]> {
    return await this.creditNamesElements.allInnerTexts();
  }
}
