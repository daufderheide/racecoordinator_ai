import { ComponentHarness } from "@angular/cdk/testing";

import { BartEditorHarnessBase } from "./bart-editor.harness.base";

export class BartEditorHarness
  extends ComponentHarness
  implements BartEditorHarnessBase
{
  static hostSelector = BartEditorHarnessBase.hostSelector;

  protected getSectionHeaders = this.locatorForAll(
    BartEditorHarnessBase.selectors.sectionHeader,
  );
  protected getDeviceNameInput = this.locatorFor(
    BartEditorHarnessBase.selectors.deviceNameInput,
  );
  protected getMinLapMsInput = this.locatorFor(
    BartEditorHarnessBase.selectors.minLapMsInput,
  );
  protected getLapPinPitBehaviorSelect = this.locatorFor(
    BartEditorHarnessBase.selectors.lapPinPitBehaviorSelect,
  );
  protected getRemoveButton = this.locatorFor(
    BartEditorHarnessBase.selectors.removeButton,
  );

  private getSectionIndex(name: "bart" | "main" | "rw"): number {
    switch (name) {
      case "bart":
        return 0;
      case "main":
        return 1;
      case "rw":
        return 2;
    }
  }

  async toggleSection(name: "bart" | "main" | "rw"): Promise<void> {
    const headers = await this.getSectionHeaders();
    const idx = this.getSectionIndex(name);
    if (headers[idx]) {
      await headers[idx].click();
    }
  }

  async isSectionExpanded(name: "bart" | "main" | "rw"): Promise<boolean> {
    const idx = this.getSectionIndex(name);
    const sections = await this.locatorForAll(
      BartEditorHarnessBase.selectors.sectionContent,
    )();
    return sections.length > idx;
  }

  async getDeviceName(): Promise<string> {
    const input = await this.getDeviceNameInput();
    return await input.getProperty("value");
  }

  async setDeviceName(name: string): Promise<void> {
    const select = await this.getDeviceNameInput();
    await select.selectOptions(name);
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
    const val = await select.getProperty("value");
    return parseInt(val, 10) || 0;
  }

  async setLapPinPitBehavior(value: number): Promise<void> {
    const select = await this.getLapPinPitBehaviorSelect();
    await select.selectOptions(value);
  }

  async removeInterface(): Promise<void> {
    const button = await this.getRemoveButton();
    await button.click();
  }
}
