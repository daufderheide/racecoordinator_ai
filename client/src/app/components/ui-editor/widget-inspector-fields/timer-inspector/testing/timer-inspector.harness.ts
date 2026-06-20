import { ComponentHarness } from "@angular/cdk/testing";

import { TimerInspectorHarnessBase } from "./timer-inspector.harness.base";

export class TimerInspectorHarness
  extends ComponentHarness
  implements TimerInspectorHarnessBase
{
  static hostSelector = TimerInspectorHarnessBase.hostSelector;

  protected getSelects = this.locatorForAll(
    TimerInspectorHarnessBase.selectors.selects,
  );
  protected getSliders = this.locatorForAll(
    TimerInspectorHarnessBase.selectors.sliders,
  );
  protected getColorPickers = this.locatorForAll(
    TimerInspectorHarnessBase.selectors.colorPickers,
  );
  protected getResetButtons = this.locatorForAll(
    TimerInspectorHarnessBase.selectors.resetButtons,
  );

  async getTimeFontFamily(): Promise<string> {
    const selects = await this.getSelects();
    return await selects[0].getProperty("value");
  }

  async setTimeFontFamily(val: string): Promise<void> {
    const selects = await this.getSelects();
    await selects[0].sendKeys(val);
    await selects[0].dispatchEvent("change");
  }

  async getTimeFontSize(): Promise<number> {
    const sliders = await this.getSliders();
    const val = await sliders[0].getProperty("value");
    return Number(val);
  }

  async setTimeFontSize(val: number): Promise<void> {
    const sliders = await this.getSliders();
    await sliders[0].setInputValue(val.toString());
    await sliders[0].dispatchEvent("change");
  }

  async getTimeTextColor(): Promise<string> {
    const colorPickers = await this.getColorPickers();
    return await colorPickers[0].getProperty("value");
  }

  async setTimeTextColor(val: string): Promise<void> {
    const colorPickers = await this.getColorPickers();
    await colorPickers[0].setInputValue(val);
    await colorPickers[0].dispatchEvent("change");
  }

  async clickResetTimeTextColor(): Promise<void> {
    const buttons = await this.getResetButtons();
    if (buttons.length > 0) {
      await buttons[0].click();
    }
  }
}
