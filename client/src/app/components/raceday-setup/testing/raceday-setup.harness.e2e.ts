import { Locator } from '@playwright/test';
import { RacedaySetupHarnessBase } from './raceday-setup.harness.base';

export class RacedaySetupHarnessE2e implements RacedaySetupHarnessBase {
  constructor(private locator: Locator) {}

  private get splashScreen() { return this.locator.locator('.splash-screen'); }
  private get connectionLostOverlay() { return this.locator.locator('.connection-lost-overlay'); }
  private get connectionLostTextEl() { return this.locator.locator('.connection-lost-text'); }
  private get serverConfigBtn() { return this.locator.locator('.server-config-btn'); }
  private get serverConfigModal() { return this.locator.locator('.server-config-modal'); }

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
