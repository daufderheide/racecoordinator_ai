import { ComponentHarness } from '@angular/cdk/testing';
import { HelpOverlayHarnessBase } from './help-overlay.harness.base';

export class HelpOverlayHarness extends ComponentHarness implements HelpOverlayHarnessBase {
  static hostSelector = 'app-help-overlay';

  protected getOverlayContainer = this.locatorForOptional('.help-overlay-container');
  protected getTitleElement = this.locatorForOptional('.popover-header h3');
  protected getContentElement = this.locatorForOptional('.popover-content p');
  protected getNextButton = this.locatorForOptional('.btn-next');
  protected getPrevButton = this.locatorForOptional('.btn-prev');
  protected getFinishButton = this.locatorForOptional('.btn-finish');
  protected getCloseButton = this.locatorForOptional('.close-btn');
  protected getStepCounterElement = this.locatorForOptional('.step-counter');
  protected getHighlightMask = this.locatorForOptional('.highlight-mask');

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
