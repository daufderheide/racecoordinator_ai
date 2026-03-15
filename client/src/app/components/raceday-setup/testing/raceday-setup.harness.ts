import { ComponentHarness } from '@angular/cdk/testing';
import { RacedaySetupHarnessBase } from './raceday-setup.harness.base';

export class RacedaySetupHarness extends ComponentHarness implements RacedaySetupHarnessBase {
  static hostSelector = RacedaySetupHarnessBase.hostSelector;

  protected getSplashScreenEl = this.locatorForOptional(RacedaySetupHarnessBase.selectors.splashScreen);
  protected getConnectionLostOverlay = this.locatorForOptional(RacedaySetupHarnessBase.selectors.connectionLostOverlay);
  protected getConnectionLostTextEl = this.locatorFor(RacedaySetupHarnessBase.selectors.connectionLostText);
  protected getServerConfigBtn = this.locatorFor(RacedaySetupHarnessBase.selectors.serverConfigBtn);
  protected getServerConfigModal = this.locatorForOptional(RacedaySetupHarnessBase.selectors.serverConfigModal);

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
