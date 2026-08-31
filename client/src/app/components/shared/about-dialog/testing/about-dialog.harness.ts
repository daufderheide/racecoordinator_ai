import { ComponentHarness } from "@angular/cdk/testing";

import { AboutDialogHarnessBase } from "./about-dialog.harness.base";

export class AboutDialogHarness
  extends ComponentHarness
  implements AboutDialogHarnessBase
{
  static hostSelector = AboutDialogHarnessBase.hostSelector;

  protected getModalContent = this.locatorForOptional(
    AboutDialogHarnessBase.selectors.content,
  );
  protected getTitleElement = this.locatorForOptional(
    AboutDialogHarnessBase.selectors.title,
  );
  protected getVersionInfoElement = this.locatorForOptional(
    AboutDialogHarnessBase.selectors.versionInfo,
  );
  protected getCharityInfoElement = this.locatorForOptional(
    AboutDialogHarnessBase.selectors.charityInfo,
  );
  protected getDonateLinkElement = this.locatorForOptional(
    AboutDialogHarnessBase.selectors.donateLink,
  );
  protected getCreditsPanelElement = this.locatorForOptional(
    AboutDialogHarnessBase.selectors.creditsPanel,
  );
  protected getCreditNamesElements = this.locatorForAll(
    AboutDialogHarnessBase.selectors.creditNames,
  );
  protected getTabButtons = this.locatorForAll(
    AboutDialogHarnessBase.selectors.tabButtons,
  );
  protected getCloseButton = this.locatorForOptional(
    AboutDialogHarnessBase.selectors.closeButton,
  );

  async isVisible(): Promise<boolean> {
    return (await this.getModalContent()) !== null;
  }

  async getTitle(): Promise<string> {
    const el = await this.getTitleElement();
    return el ? await el.text() : "";
  }

  async getVersionInfoText(): Promise<string> {
    const el = await this.getVersionInfoElement();
    return el ? await el.text() : "";
  }

  async clickClose(): Promise<void> {
    const btn = await this.getCloseButton();
    if (btn) await btn.click();
  }

  async clickTab(index: number): Promise<void> {
    const tabs = await this.getTabButtons();
    if (tabs[index]) {
      await tabs[index].click();
    }
  }

  async isCharityTabVisible(): Promise<boolean> {
    return (await this.getCharityInfoElement()) !== null;
  }

  async getDonateLinkHref(): Promise<string | null> {
    const el = await this.getDonateLinkElement();
    return el ? await el.getAttribute("href") : null;
  }

  async isCreditsTabVisible(): Promise<boolean> {
    return (await this.getCreditsPanelElement()) !== null;
  }

  async getCreditNames(): Promise<string[]> {
    const elements = await this.getCreditNamesElements();
    return Promise.all(elements.map((el) => el.text()));
  }
}
