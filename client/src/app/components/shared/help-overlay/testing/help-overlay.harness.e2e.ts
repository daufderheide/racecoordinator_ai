import { Locator, Page } from '@playwright/test';
import { HelpOverlayHarnessBase } from './help-overlay.harness.base';

export class HelpOverlayHarnessE2e implements HelpOverlayHarnessBase {
  constructor(private locator: Locator, private page: Page) {}

  private get base() { return HelpOverlayHarnessBase; }

  private get overlayContainer() { return this.locator.locator(this.base.selectors.overlayContainer); }
  private get titleElement() { return this.locator.locator(this.base.selectors.title); }
  private get contentElement() { return this.locator.locator(this.base.selectors.content); }
  private get nextButton() { return this.locator.locator(this.base.selectors.nextButton); }
  private get prevButton() { return this.locator.locator(this.base.selectors.prevButton); }
  private get finishButton() { return this.locator.locator(this.base.selectors.finishButton); }
  private get closeButton() { return this.locator.locator(this.base.selectors.closeButton); }
  private get stepCounterElement() { return this.locator.locator(this.base.selectors.stepCounter); }
  private get highlightMask() { return this.locator.locator(this.base.selectors.highlightMask); }
  private get popover() { return this.locator.locator(this.base.selectors.popover); }

  async isVisible(): Promise<boolean> {
    return await this.overlayContainer.isVisible();
  }

  async getTitle(): Promise<string> {
    return await this.titleElement.innerText();
  }

  async getContent(): Promise<string> {
    return await this.contentElement.innerText();
  }

  async clickNext(): Promise<void> {
    await this.nextButton.click();
  }

  async clickPrevious(): Promise<void> {
    await this.prevButton.click();
  }

  async clickFinish(): Promise<void> {
    await this.finishButton.click();
  }

  async clickClose(): Promise<void> {
    await this.closeButton.click();
  }

  async getStepCounter(): Promise<string> {
    if (await this.stepCounterElement.isVisible()) {
        return await this.stepCounterElement.innerText();
    }
    return '';
  }

  async hasHighlightMask(): Promise<boolean> {
    return await this.highlightMask.isVisible();
  }

  async waitForStable(): Promise<void> {
    await this.popover.waitFor({ state: 'visible' });

    let lastPopoverBox = await this.popover.boundingBox();
    let lastMaskBox = (await this.highlightMask.count()) > 0 ? await this.highlightMask.boundingBox() : null;
    let stableCount = 0;

    for (let i = 0; i < 40; i++) { // Max 2s
      await this.page.waitForTimeout(50);
      const currentPopoverBox = await this.popover.boundingBox();
      const currentMaskBox = (await this.highlightMask.count()) > 0 ? await this.highlightMask.boundingBox() : null;

      const popoverStable = currentPopoverBox && lastPopoverBox &&
        currentPopoverBox.x === lastPopoverBox.x &&
        currentPopoverBox.y === lastPopoverBox.y &&
        currentPopoverBox.width === lastPopoverBox.width &&
        currentPopoverBox.height === lastPopoverBox.height;

      const maskStable = (!currentMaskBox && !lastMaskBox) || (currentMaskBox && lastMaskBox &&
        currentMaskBox.x === lastMaskBox.x &&
        currentMaskBox.y === lastMaskBox.y &&
        currentMaskBox.width === lastMaskBox.width &&
        currentMaskBox.height === lastMaskBox.height);

      if (popoverStable && maskStable) {
        stableCount++;
      } else {
        stableCount = 0;
      }

      if (stableCount >= 5) break;
      lastPopoverBox = currentPopoverBox;
      lastMaskBox = currentMaskBox;
    }

    // Safety margin
    await this.page.waitForTimeout(100);
  }
}
