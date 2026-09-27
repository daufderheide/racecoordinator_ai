import { ComponentHarness } from "@angular/cdk/testing";
import { CustomSelectHarness } from "@app/components/shared/custom-select/testing/custom-select.harness";

import { BartEditorHarnessBase } from "./bart-editor.harness.base";

export class BartEditorHarness
  extends ComponentHarness
  implements BartEditorHarnessBase
{
  static hostSelector = BartEditorHarnessBase.hostSelector;

  protected getDeviceNameSelect = this.locatorFor(
    CustomSelectHarness.with({
      selector: BartEditorHarnessBase.selectors.deviceNameInput,
    }),
  );
  protected getMinLapMsInput = this.locatorFor(
    BartEditorHarnessBase.selectors.minLapMsInput,
  );
  protected getLapPinPitBehaviorSelect = this.locatorFor(
    CustomSelectHarness.with({
      selector: BartEditorHarnessBase.selectors.lapPinPitBehaviorSelect,
    }),
  );
  protected getRemoveButton = this.locatorFor(
    BartEditorHarnessBase.selectors.removeButton,
  );

  async toggleSection(name: "bart" | "main" | "rw"): Promise<void> {
    const headers = await this.locatorForAll(
      BartEditorHarnessBase.selectors.sectionHeader,
    )();
    const idx = name === "bart" ? 0 : name === "main" ? 1 : 2;
    if (headers.length > idx) {
      await headers[idx].click();
    }
  }

  async isSectionExpanded(name: "bart" | "main" | "rw"): Promise<boolean> {
    const idx = name === "bart" ? 0 : name === "main" ? 1 : 2;
    const sections = await this.locatorForAll(
      `${BartEditorHarnessBase.selectors.section}.expanded`,
    )();
    return sections.length > idx;
  }

  async getDeviceName(): Promise<string> {
    const select = await this.getDeviceNameSelect();
    return await select.getValue();
  }

  async setDeviceName(name: string): Promise<void> {
    const select = await this.getDeviceNameSelect();
    await select.selectOptionByValue(name);
  }

  async getMinLapMs(): Promise<number> {
    const input = await this.getMinLapMsInput();
    const val = await input.getProperty("value");
    return parseInt(val, 10) || 0;
  }

  async setMinLapMs(ms: number): Promise<void> {
    const input = await this.getMinLapMsInput();
    await input.clear();
    await input.sendKeys(ms.toString());
  }

  async getLapPinPitBehavior(): Promise<number> {
    const select = await this.getLapPinPitBehaviorSelect();
    const val = (await select.getValue()) || "0";
    return parseInt(val, 10) || 0;
  }

  async setLapPinPitBehavior(value: number): Promise<void> {
    const select = await this.getLapPinPitBehaviorSelect();
    await select.selectOptionByValue(value.toString());
  }

  async removeInterface(): Promise<void> {
    const button = await this.getRemoveButton();
    await button.click();
  }
}
