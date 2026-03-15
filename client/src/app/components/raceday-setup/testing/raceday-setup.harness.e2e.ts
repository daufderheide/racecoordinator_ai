import { Locator } from '@playwright/test';
import { RacedaySetupHarnessBase } from './raceday-setup.harness.base';

export class RacedaySetupHarnessE2e implements RacedaySetupHarnessBase {
  constructor(private locator: Locator) {}

  private get base() { return RacedaySetupHarnessBase; }

  private get splashScreen() { return this.locator.locator(this.base.selectors.splashScreen); }
  private get connectionLostOverlay() { return this.locator.locator(this.base.selectors.connectionLostOverlay); }
  private get connectionLostTextEl() { return this.locator.locator(this.base.selectors.connectionLostText); }
  private get serverConfigBtn() { return this.locator.locator(this.base.selectors.serverConfigBtn); }
  private get serverConfigModal() { return this.locator.locator(this.base.selectors.serverConfigModal); }

  async isSplashScreenVisible(): Promise<boolean> {
    return await this.splashScreen.isVisible();
  }

  async isConnectionLostOverlayVisible(): Promise<boolean> {
    return await this.connectionLostOverlay.isVisible();
  }

  async getConnectionLostText(): Promise<string> {
    return await this.connectionLostTextEl.innerText();
  }

  async clickServerConfig(): Promise<void> {
    await this.serverConfigBtn.click();
  }

  async isServerConfigModalVisible(): Promise<boolean> {
    return await this.serverConfigModal.isVisible();
  }
}
