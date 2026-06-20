import { ComponentHarness } from "@angular/cdk/testing";

import { LeaderboardInspectorHarnessBase } from "./leaderboard-inspector.harness.base";

export class LeaderboardInspectorHarness
  extends ComponentHarness
  implements LeaderboardInspectorHarnessBase
{
  static hostSelector = LeaderboardInspectorHarnessBase.hostSelector;

  protected getSelects = this.locatorForAll(
    LeaderboardInspectorHarnessBase.selectors.selects,
  );
  protected getSliders = this.locatorForAll(
    LeaderboardInspectorHarnessBase.selectors.sliders,
  );
  protected getColorPickers = this.locatorForAll(
    LeaderboardInspectorHarnessBase.selectors.colorPickers,
  );
  protected getResetButtons = this.locatorForAll(
    LeaderboardInspectorHarnessBase.selectors.resetButtons,
  );

  async getTitleFontFamily(): Promise<string> {
    const selects = await this.getSelects();
    return await selects[0].getProperty("value");
  }

  async setTitleFontFamily(val: string): Promise<void> {
    const selects = await this.getSelects();
    await selects[0].sendKeys(val);
    await selects[0].dispatchEvent("change");
  }

  async getTitleFontSize(): Promise<number> {
    const sliders = await this.getSliders();
    const val = await sliders[0].getProperty("value");
    return Number(val);
  }

  async setTitleFontSize(val: number): Promise<void> {
    const sliders = await this.getSliders();
    await sliders[0].setInputValue(val.toString());
    await sliders[0].dispatchEvent("change");
  }

  async getTitleTextColor(): Promise<string> {
    const colorPickers = await this.getColorPickers();
    return await colorPickers[0].getProperty("value");
  }

  async setTitleTextColor(val: string): Promise<void> {
    const colorPickers = await this.getColorPickers();
    await colorPickers[0].setInputValue(val);
    await colorPickers[0].dispatchEvent("change");
  }

  async clickResetTitleTextColor(): Promise<void> {
    const buttons = await this.getResetButtons();
    if (buttons.length > 0) {
      await buttons[0].click();
    }
  }

  async getOverallLeaderFontFamily(): Promise<string> {
    const selects = await this.getSelects();
    return await selects[1].getProperty("value");
  }

  async setOverallLeaderFontFamily(val: string): Promise<void> {
    const selects = await this.getSelects();
    await selects[1].sendKeys(val);
    await selects[1].dispatchEvent("change");
  }

  async getOverallLeaderFontSize(): Promise<number> {
    const sliders = await this.getSliders();
    const val = await sliders[1].getProperty("value");
    return Number(val);
  }

  async setOverallLeaderFontSize(val: number): Promise<void> {
    const sliders = await this.getSliders();
    await sliders[1].setInputValue(val.toString());
    await sliders[1].dispatchEvent("change");
  }

  async getOverallLeaderTextColor(): Promise<string> {
    const colorPickers = await this.getColorPickers();
    return await colorPickers[1].getProperty("value");
  }

  async setOverallLeaderTextColor(val: string): Promise<void> {
    const colorPickers = await this.getColorPickers();
    await colorPickers[1].setInputValue(val);
    await colorPickers[1].dispatchEvent("change");
  }

  async clickResetOverallLeaderTextColor(): Promise<void> {
    const buttons = await this.getResetButtons();
    if (buttons.length > 1) {
      await buttons[1].click();
    } else if (buttons.length > 0) {
      await buttons[0].click();
    }
  }

  async getRestFontFamily(): Promise<string> {
    const selects = await this.getSelects();
    return await selects[2].getProperty("value");
  }

  async setRestFontFamily(val: string): Promise<void> {
    const selects = await this.getSelects();
    await selects[2].sendKeys(val);
    await selects[2].dispatchEvent("change");
  }

  async getRestFontSize(): Promise<number> {
    const sliders = await this.getSliders();
    const val = await sliders[2].getProperty("value");
    return Number(val);
  }

  async setRestFontSize(val: number): Promise<void> {
    const sliders = await this.getSliders();
    await sliders[2].setInputValue(val.toString());
    await sliders[2].dispatchEvent("change");
  }

  async getRestTextColor(): Promise<string> {
    const colorPickers = await this.getColorPickers();
    return await colorPickers[2].getProperty("value");
  }

  async setRestTextColor(val: string): Promise<void> {
    const colorPickers = await this.getColorPickers();
    await colorPickers[2].setInputValue(val);
    await colorPickers[2].dispatchEvent("change");
  }

  async clickResetRestTextColor(): Promise<void> {
    const buttons = await this.getResetButtons();
    if (buttons.length > 0) {
      await buttons[buttons.length - 1].click();
    }
  }
}
