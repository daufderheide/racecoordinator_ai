import { ComponentHarness } from "@angular/cdk/testing";
import { CustomSelectHarness } from "@app/components/shared/custom-select/testing/custom-select.harness";

import { TextInfoInspectorHarnessBase } from "./text-info-inspector.harness.base";

export class TextInfoInspectorHarness
  extends ComponentHarness
  implements TextInfoInspectorHarnessBase
{
  static hostSelector = TextInfoInspectorHarnessBase.hostSelector;

  protected getSelects = this.locatorForAll(CustomSelectHarness);
  protected getSliders = this.locatorForAll(
    TextInfoInspectorHarnessBase.selectors.sliders,
  );
  protected getColorPickers = this.locatorForAll(
    TextInfoInspectorHarnessBase.selectors.colorPickers,
  );
  protected getResetButtons = this.locatorForAll(
    TextInfoInspectorHarnessBase.selectors.resetButtons,
  );

  async getLabelFontFamily(): Promise<string> {
    const selects = await this.getSelects();
    return await selects[0].getValue();
  }

  async setLabelFontFamily(val: string): Promise<void> {
    const selects = await this.getSelects();
    await selects[0].selectOptionByValue(val);
  }

  async getLabelFontSize(): Promise<number> {
    const sliders = await this.getSliders();
    const val = await sliders[0].getProperty("value");
    return Number(val);
  }

  async setLabelFontSize(val: number): Promise<void> {
    const sliders = await this.getSliders();
    await sliders[0].setInputValue(val.toString());
    await sliders[0].dispatchEvent("change");
  }

  async getLabelTextColor(): Promise<string> {
    const colorPickers = await this.getColorPickers();
    return await colorPickers[0].getProperty("value");
  }

  async setLabelTextColor(val: string): Promise<void> {
    const colorPickers = await this.getColorPickers();
    await colorPickers[0].setInputValue(val);
    await colorPickers[0].dispatchEvent("change");
  }

  async clickResetLabelTextColor(): Promise<void> {
    const buttons = await this.getResetButtons();
    if (buttons.length > 0) {
      await buttons[0].click();
    }
  }

  async getValueFontFamily(): Promise<string> {
    const selects = await this.getSelects();
    return await selects[1].getValue();
  }

  async setValueFontFamily(val: string): Promise<void> {
    const selects = await this.getSelects();
    await selects[1].selectOptionByValue(val);
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
    }
  }
}
