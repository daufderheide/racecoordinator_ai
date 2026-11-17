import { ComponentHarness } from "@angular/cdk/testing";

import { FlagInspectorHarnessBase } from "./flag-inspector.harness.base";

export class FlagInspectorHarness
  extends ComponentHarness
  implements FlagInspectorHarnessBase
{
  static hostSelector = FlagInspectorHarnessBase.hostSelector;

  protected getColorPickers = this.locatorForAll(
    FlagInspectorHarnessBase.selectors.colorPickers,
  );
  protected getResetButtons = this.locatorForAll(
    FlagInspectorHarnessBase.selectors.resetButtons,
  );

  async getBackgroundColor(): Promise<string> {
    const colorPickers = await this.getColorPickers();
    return await colorPickers[0].getProperty("value");
  }

  async setBackgroundColor(val: string): Promise<void> {
    const colorPickers = await this.getColorPickers();
    await colorPickers[0].setInputValue(val);
    await colorPickers[0].dispatchEvent("change");
  }

  async clickResetBackgroundColor(): Promise<void> {
    const buttons = await this.getResetButtons();
    if (buttons.length > 0) {
      await buttons[0].click();
    }
  }
}
