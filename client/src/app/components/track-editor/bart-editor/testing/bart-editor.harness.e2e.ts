import { Locator } from "@playwright/test";

import { BartEditorHarnessBase } from "./bart-editor.harness.base";

export class BartEditorHarnessE2e implements BartEditorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return BartEditorHarnessBase;
  }

  private get sectionHeaders() {
    return this.locator.locator(this.base.selectors.sectionHeader);
  }
  private get deviceNameInput() {
    return this.locator.locator(this.base.selectors.deviceNameInput);
  }
  private get minLapMsInput() {
    return this.locator.locator(this.base.selectors.minLapMsInput);
  }
  private get lapPinPitBehaviorSelect() {
    return this.locator.locator(this.base.selectors.lapPinPitBehaviorSelect);
  }
  private get removeButton() {
    return this.locator.locator(this.base.selectors.removeButton);
  }

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
    const idx = this.getSectionIndex(name);
    await this.sectionHeaders.nth(idx).click();
  }

  async isSectionExpanded(name: "bart" | "main" | "rw"): Promise<boolean> {
    const idx = this.getSectionIndex(name);
    const contents = this.locator.locator(this.base.selectors.sectionContent);
    return await contents.nth(idx).isVisible();
  }

  async getDeviceName(): Promise<string> {
    return (await this.deviceNameInput.getAttribute("data-value")) || "";
  }

  async setDeviceName(name: string): Promise<void> {
    await this.deviceNameInput.locator(".custom-select-trigger").click();
    await this.deviceNameInput
      .locator(`.custom-select-option[data-value="${name}"]`)
      .click();
  }

  async getMinLapMs(): Promise<number> {
    const val = await this.minLapMsInput.inputValue();
    return parseInt(val, 10) || 0;
  }

  async setMinLapMs(ms: number): Promise<void> {
    await this.minLapMsInput.fill(ms.toString());
  }

  async getLapPinPitBehavior(): Promise<number> {
    const val =
      (await this.lapPinPitBehaviorSelect.getAttribute("data-value")) || "0";
    return parseInt(val, 10) || 0;
  }

  async setLapPinPitBehavior(value: number): Promise<void> {
    await this.lapPinPitBehaviorSelect
      .locator(".custom-select-trigger")
      .click();
    await this.lapPinPitBehaviorSelect
      .locator(`.custom-select-option[data-value="${value}"]`)
      .click();
  }

  async removeInterface(): Promise<void> {
    await this.removeButton.click();
  }
}
