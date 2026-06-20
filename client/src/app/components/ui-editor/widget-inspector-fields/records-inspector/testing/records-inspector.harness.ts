import { ComponentHarness } from "@angular/cdk/testing";

import { RecordsInspectorHarnessBase } from "./records-inspector.harness.base";

export class RecordsInspectorHarness
  extends ComponentHarness
  implements RecordsInspectorHarnessBase
{
  static hostSelector = RecordsInspectorHarnessBase.hostSelector;

  protected getSelects = this.locatorForAll(
    RecordsInspectorHarnessBase.selectors.selects,
  );
  protected getSliders = this.locatorForAll(
    RecordsInspectorHarnessBase.selectors.sliders,
  );
  protected getColorPickers = this.locatorForAll(
    RecordsInspectorHarnessBase.selectors.colorPickers,
  );
  protected getResetButtons = this.locatorForAll(
    RecordsInspectorHarnessBase.selectors.resetButtons,
  );

  async getHeaderFontFamily(): Promise<string> {
    const selects = await this.getSelects();
    return await selects[0].getProperty("value");
  }

  async setHeaderFontFamily(val: string): Promise<void> {
    const selects = await this.getSelects();
    await selects[0].sendKeys(val);
    await selects[0].dispatchEvent("change");
  }

  async getHeaderFontSize(): Promise<number> {
    const sliders = await this.getSliders();
    const val = await sliders[0].getProperty("value");
    return Number(val);
  }

  async setHeaderFontSize(val: number): Promise<void> {
    const sliders = await this.getSliders();
    await sliders[0].setInputValue(val.toString());
    await sliders[0].dispatchEvent("change");
  }

  async getHeaderTextColor(): Promise<string> {
    const colorPickers = await this.getColorPickers();
    return await colorPickers[0].getProperty("value");
  }

  async setHeaderTextColor(val: string): Promise<void> {
    const colorPickers = await this.getColorPickers();
    await colorPickers[0].setInputValue(val);
    await colorPickers[0].dispatchEvent("change");
  }

  async clickResetHeaderTextColor(): Promise<void> {
    const buttons = await this.getResetButtons();
    if (buttons.length > 0) {
      await buttons[0].click();
    }
  }

  async getValueFontFamily(): Promise<string> {
    const selects = await this.getSelects();
    return await selects[1].getProperty("value");
  }

  async setValueFontFamily(val: string): Promise<void> {
    const selects = await this.getSelects();
    await selects[1].sendKeys(val);
    await selects[1].dispatchEvent("change");
  }

  async getValueFontSize(): Promise<number> {
    const sliders = await this.getSliders();
    const val = await sliders[1].getProperty("value");
    return Number(val);
  }

  async setValueFontSize(val: number): Promise<void> {
    const sliders = await this.getSliders();
    await sliders[1].setInputValue(val.toString());
    await sliders[1].dispatchEvent("change");
  }

  async getValueTextColor(): Promise<string> {
    const colorPickers = await this.getColorPickers();
    return await colorPickers[1].getProperty("value");
  }

  async setValueTextColor(val: string): Promise<void> {
    const colorPickers = await this.getColorPickers();
    await colorPickers[1].setInputValue(val);
    await colorPickers[1].dispatchEvent("change");
  }

  async clickResetValueTextColor(): Promise<void> {
    const buttons = await this.getResetButtons();
    if (buttons.length > 1) {
      await buttons[1].click();
    } else if (buttons.length > 0) {
      await buttons[0].click();
    }
  }
}
