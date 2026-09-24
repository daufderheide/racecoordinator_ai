import { ComponentHarness } from "@angular/cdk/testing";

import { CameraInterfaceHarnessBase } from "./camera-interface.harness.base";

export class CameraInterfaceHarness
  extends ComponentHarness
  implements CameraInterfaceHarnessBase
{
  static hostSelector = CameraInterfaceHarnessBase.hostSelector;

  protected getBackBtn = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.backBtn,
  );
  protected getDoneBtn = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.doneBtn,
  );
  protected getStatusPill = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.statusPill,
  );
  protected getStatusTextEl = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.statusText,
  );
  protected getFpsMetricEl = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.fpsMetric,
  );
  protected getBatteryMetricEl = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.batteryMetric,
  );
  protected getAutoSnapBtn = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.autoSnapBtn,
  );
  protected getFlipBtn = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.flipBtn,
  );
  protected getSettingsBtn = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.settingsBtn,
  );
  protected getSettingsCard = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.settingsCard,
  );
  protected getSettingsCloseBtn = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.settingsCloseBtn,
  );
  protected getSettingsDoneBtn = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.settingsDoneBtn,
  );
  protected getAutoSnapCard = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.autoSnapCard,
  );
  protected getAutoSnapCancelBtn = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.autoSnapCancelBtn,
  );
  protected getAutoSnapSkipBtn = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.autoSnapSkipBtn,
  );
  protected getCameraErrorCard = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.cameraErrorCard,
  );
  protected getCameraErrorRetryBtn = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.cameraErrorRetryBtn,
  );
  protected getCameraErrorLearnMoreBtn = this.locatorForOptional(
    CameraInterfaceHarnessBase.selectors.cameraErrorLearnMoreBtn,
  );
  protected getGateGroups = this.locatorForAll(
    CameraInterfaceHarnessBase.selectors.gateGroups,
  );

  async isBackVisible(): Promise<boolean> {
    return (await this.getBackBtn()) !== null;
  }

  async clickBack(): Promise<void> {
    const btn = await this.getBackBtn();
    if (btn) {
      await btn.click();
    }
  }

  async isDoneVisible(): Promise<boolean> {
    return (await this.getDoneBtn()) !== null;
  }

  async clickDone(): Promise<void> {
    const btn = await this.getDoneBtn();
    if (btn) {
      await btn.click();
    }
  }

  async isConnected(): Promise<boolean> {
    const pill = await this.getStatusPill();
    return pill ? await pill.hasClass("online") : false;
  }

  async getStatusText(): Promise<string> {
    const el = await this.getStatusTextEl();
    return el ? (await el.text()).trim() : "";
  }

  async getFpsText(): Promise<string> {
    const el = await this.getFpsMetricEl();
    return el ? (await el.text()).trim() : "";
  }

  async getBatteryText(): Promise<string> {
    const el = await this.getBatteryMetricEl();
    return el ? (await el.text()).trim() : "";
  }

  async isAutoSnapVisible(): Promise<boolean> {
    return (await this.getAutoSnapBtn()) !== null;
  }

  async clickAutoSnap(): Promise<void> {
    const btn = await this.getAutoSnapBtn();
    if (btn) {
      await btn.click();
    }
  }

  async isAutoSnapOpen(): Promise<boolean> {
    return (await this.getAutoSnapCard()) !== null;
  }

  async clickAutoSnapCancel(): Promise<void> {
    const btn = await this.getAutoSnapCancelBtn();
    if (btn) {
      await btn.click();
    }
  }

  async clickAutoSnapSkip(): Promise<void> {
    const btn = await this.getAutoSnapSkipBtn();
    if (btn) {
      await btn.click();
    }
  }

  async isFlipVisible(): Promise<boolean> {
    return (await this.getFlipBtn()) !== null;
  }

  async clickFlip(): Promise<void> {
    const btn = await this.getFlipBtn();
    if (btn) {
      await btn.click();
    }
  }

  async isSettingsVisible(): Promise<boolean> {
    return (await this.getSettingsBtn()) !== null;
  }

  async clickSettings(): Promise<void> {
    const btn = await this.getSettingsBtn();
    if (btn) {
      await btn.click();
    }
  }

  async isSettingsOpen(): Promise<boolean> {
    return (await this.getSettingsCard()) !== null;
  }

  async closeSettings(): Promise<void> {
    const closeBtn = await this.getSettingsCloseBtn();
    if (closeBtn) {
      await closeBtn.click();
    } else {
      const doneBtn = await this.getSettingsDoneBtn();
      if (doneBtn) {
        await doneBtn.click();
      }
    }
  }

  async isErrorVisible(): Promise<boolean> {
    return (await this.getCameraErrorCard()) !== null;
  }

  async clickErrorRetry(): Promise<void> {
    const btn = await this.getCameraErrorRetryBtn();
    if (btn) {
      await btn.click();
    }
  }

  async clickErrorLearnMore(): Promise<void> {
    const btn = await this.getCameraErrorLearnMoreBtn();
    if (btn) {
      await btn.click();
    }
  }

  async getGateCount(): Promise<number> {
    const gates = await this.getGateGroups();
    return gates.length;
  }
}
