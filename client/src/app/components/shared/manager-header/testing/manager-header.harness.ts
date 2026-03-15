import { ComponentHarness } from '@angular/cdk/testing';
import { ManagerHeaderHarnessBase } from './manager-header.harness.base';
import { BackButtonHarness } from '../../back-button/testing/back-button.harness';
import { ToolbarHarness } from '../../toolbar/testing/toolbar.harness';

export class ManagerHeaderHarness extends ComponentHarness implements ManagerHeaderHarnessBase {
  static hostSelector = ManagerHeaderHarnessBase.hostSelector;

  protected getTitleText = this.locatorFor(ManagerHeaderHarnessBase.selectors.title);
  
  async getTitle(): Promise<string> {
    const title = await this.getTitleText();
    return (await title.text()).trim();
  }

  async hasBackButton(): Promise<boolean> {
    const btns = await this.locatorForAll(ManagerHeaderHarnessBase.selectors.backButton)();
    return btns.length > 0;
  }

  async hasToolbar(): Promise<boolean> {
    const toolbars = await this.locatorForAll(ManagerHeaderHarnessBase.selectors.toolbar)();
    return toolbars.length > 0;
  }

  async getBackButton(): Promise<BackButtonHarness> {
    return this.locatorFor(BackButtonHarness)();
  }

  async getToolbar(): Promise<ToolbarHarness> {
    return this.locatorFor(ToolbarHarness)();
  }
}
