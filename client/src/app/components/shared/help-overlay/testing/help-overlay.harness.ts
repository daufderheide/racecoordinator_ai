import { ComponentHarness } from '@angular/cdk/testing';
import { HelpOverlayHarnessBase } from './help-overlay.harness.base';

export class HelpOverlayHarness extends ComponentHarness implements HelpOverlayHarnessBase {
  static hostSelector = HelpOverlayHarnessBase.hostSelector;

  protected getOverlayContainer = this.locatorForOptional(HelpOverlayHarnessBase.selectors.overlayContainer);
  protected getTitleElement = this.locatorForOptional(HelpOverlayHarnessBase.selectors.title);
  protected getContentElement = this.locatorForOptional(HelpOverlayHarnessBase.selectors.content);
  protected getNextButton = this.locatorForOptional(HelpOverlayHarnessBase.selectors.nextButton);
  protected getPrevButton = this.locatorForOptional(HelpOverlayHarnessBase.selectors.prevButton);
  protected getFinishButton = this.locatorForOptional(HelpOverlayHarnessBase.selectors.finishButton);
  protected getCloseButton = this.locatorForOptional(HelpOverlayHarnessBase.selectors.closeButton);
  protected getStepCounterElement = this.locatorForOptional(HelpOverlayHarnessBase.selectors.stepCounter);
  protected getHighlightMask = this.locatorForOptional(HelpOverlayHarnessBase.selectors.highlightMask);

  async isVisible(): Promise<boolean> {
    return (await this.getOverlayContainer()) !== null;
  }

  async getTitle(): Promise<string> {
    const el = await this.getTitleElement();
    return el ? await el.text() : '';
  }

  async getContent(): Promise<string> {
    const el = await this.getContentElement();
    return el ? await el.text() : '';
  }

  async clickNext(): Promise<void> {
    const btn = await this.getNextButton();
    if (btn) await btn.click();
  }

  async clickPrevious(): Promise<void> {
    const btn = await this.getPrevButton();
    if (btn) await btn.click();
  }

  async clickFinish(): Promise<void> {
    const btn = await this.getFinishButton();
    if (btn) await btn.click();
  }

  async clickClose(): Promise<void> {
    const btn = await this.getCloseButton();
    if (btn) await btn.click();
  }

  async getStepCounter(): Promise<string> {
    const el = await this.getStepCounterElement();
    return el ? await el.text() : '';
  }

  async hasHighlightMask(): Promise<boolean> {
    return (await this.getHighlightMask()) !== null;
  }

  /** In Angular unit tests, animations/stability are usually handled by tick() / fixture.detectChanges() */
  async waitForStable(): Promise<void> {
    return Promise.resolve();
  }
}
