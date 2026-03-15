import { ComponentHarness } from '@angular/cdk/testing';
import { RacedaySetupHarnessBase } from './raceday-setup.harness.base';

export class RacedaySetupHarness extends ComponentHarness implements RacedaySetupHarnessBase {
  static hostSelector = 'app-raceday-setup';

  protected getSplashScreenEl = this.locatorForOptional('.splash-screen');
  protected getConnectionLostOverlay = this.locatorForOptional('.connection-lost-overlay');
  protected getConnectionLostTextEl = this.locatorFor('.connection-lost-text');
  protected getServerConfigBtn = this.locatorFor('.server-config-btn');
  protected getServerConfigModal = this.locatorForOptional('.server-config-modal');

  async isSplashScreenVisible(): Promise<boolean> {
    const el = await this.getSplashScreenEl();
    return el !== null;
  }

  async isConnectionLostOverlayVisible(): Promise<boolean> {
    const el = await this.getConnectionLostOverlay();
    return el !== null;
  }

  async getConnectionLostText(): Promise<string> {
    const el = await this.getConnectionLostTextEl();
    return await el.text();
  }

  async clickServerConfig(): Promise<void> {
    const btn = await this.getServerConfigBtn();
    await btn.click();
  }

  async isServerConfigModalVisible(): Promise<boolean> {
    const modal = await this.getServerConfigModal();
    return modal !== null;
  }
}
