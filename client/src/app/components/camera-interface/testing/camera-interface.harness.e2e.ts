import { Locator } from "@playwright/test";

import { CameraInterfaceHarnessBase } from "./camera-interface.harness.base";

export class CameraInterfaceHarnessE2e implements CameraInterfaceHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return CameraInterfaceHarnessBase;
  }

  private get backBtn() {
    return this.locator.locator(this.base.selectors.backBtn);
  }
  private get doneBtn() {
    return this.locator.locator(this.base.selectors.doneBtn);
  }
  private get statusPill() {
    return this.locator.locator(this.base.selectors.statusPill);
  }
  private get statusText() {
    return this.locator.locator(this.base.selectors.statusText);
  }
  private get fpsMetric() {
    return this.locator.locator(this.base.selectors.fpsMetric);
  }
  private get batteryMetric() {
    return this.locator.locator(this.base.selectors.batteryMetric);
  }
  private get autoSnapBtn() {
    return this.locator.locator(this.base.selectors.autoSnapBtn);
  }
  private get flipBtn() {
    return this.locator.locator(this.base.selectors.flipBtn);
  }
  private get settingsBtn() {
    return this.locator.locator(this.base.selectors.settingsBtn);
  }
  private get settingsCard() {
    return this.locator.locator(this.base.selectors.settingsCard);
  }
  private get settingsCloseBtn() {
    return this.locator.locator(this.base.selectors.settingsCloseBtn);
  }
  private get settingsDoneBtn() {
    return this.locator.locator(this.base.selectors.settingsDoneBtn);
  }
  private get autoSnapCard() {
    return this.locator.locator(this.base.selectors.autoSnapCard);
  }
  private get autoSnapCancelBtn() {
    return this.locator.locator(this.base.selectors.autoSnapCancelBtn);
  }
  private get autoSnapSkipBtn() {
    return this.locator.locator(this.base.selectors.autoSnapSkipBtn);
  }
  private get cameraErrorCard() {
    return this.locator.locator(this.base.selectors.cameraErrorCard);
  }
  private get cameraErrorRetryBtn() {
    return this.locator.locator(this.base.selectors.cameraErrorRetryBtn);
  }
  private get cameraErrorLearnMoreBtn() {
    return this.locator.locator(this.base.selectors.cameraErrorLearnMoreBtn);
  }
  private get gateGroups() {
    return this.locator.locator(this.base.selectors.gateGroups);
  }

  async waitForVisible(timeout = 10000): Promise<void> {
    await this.locator.waitFor({ state: "visible", timeout });
  }

  async isBackVisible(): Promise<boolean> {
    return await this.backBtn.isVisible();
  }

  async clickBack(): Promise<void> {
    await this.backBtn.click();
  }

  async isDoneVisible(): Promise<boolean> {
    return await this.doneBtn.isVisible();
  }

  async clickDone(): Promise<void> {
    await this.doneBtn.click();
  }

  async isConnected(): Promise<boolean> {
    const classes = (await this.statusPill.getAttribute("class")) || "";
    return classes.includes("online");
  }

  async getStatusText(): Promise<string> {
    return (await this.statusText.innerText()).trim();
  }

  async getFpsText(): Promise<string> {
    return (await this.fpsMetric.innerText()).trim();
  }

  async getBatteryText(): Promise<string> {
    return (await this.batteryMetric.innerText()).trim();
  }

  async isAutoSnapVisible(): Promise<boolean> {
    return await this.autoSnapBtn.isVisible();
  }

  async clickAutoSnap(): Promise<void> {
    await this.autoSnapBtn.waitFor({ state: "visible" });
    await this.autoSnapBtn.click();
    await this.autoSnapCard.waitFor({ state: "visible" });
  }

  async isAutoSnapOpen(): Promise<boolean> {
    return await this.autoSnapCard.isVisible();
  }

  async clickAutoSnapCancel(): Promise<void> {
    await this.autoSnapCancelBtn.click();
  }

  async clickAutoSnapSkip(): Promise<void> {
    await this.autoSnapSkipBtn.click();
  }

  async isFlipVisible(): Promise<boolean> {
    return await this.flipBtn.isVisible();
  }

  async clickFlip(): Promise<void> {
    await this.flipBtn.click();
  }

  async isSettingsVisible(): Promise<boolean> {
    return await this.settingsBtn.isVisible();
  }

  async clickSettings(): Promise<void> {
    await this.settingsBtn.waitFor({ state: "visible" });
    await this.settingsBtn.click();
    await this.settingsCard.waitFor({ state: "visible" });
  }

  async isSettingsOpen(): Promise<boolean> {
    return await this.settingsCard.isVisible();
  }

  async closeSettings(): Promise<void> {
    if (await this.settingsCloseBtn.isVisible()) {
      await this.settingsCloseBtn.click();
    } else {
      await this.settingsDoneBtn.click();
    }
  }

  async isErrorVisible(): Promise<boolean> {
    return await this.cameraErrorCard.isVisible();
  }

  async clickErrorRetry(): Promise<void> {
    await this.cameraErrorRetryBtn.click();
  }

  async clickErrorLearnMore(): Promise<void> {
    await this.cameraErrorLearnMoreBtn.click();
  }

  async getGateCount(): Promise<number> {
    return await this.gateGroups.count();
  }
}
