import { Locator } from "@playwright/test";

import { PhidgetEditorHarnessBase } from "./phidget-editor.harness.base";

export class PhidgetEditorHarnessE2e implements PhidgetEditorHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return PhidgetEditorHarnessBase;
  }

  private get deviceSelect(): Locator {
    return this.locator.locator(this.base.selectors.deviceSelect).first();
  }

  private get removeButton(): Locator {
    return this.locator.locator(this.base.selectors.removeButton).first();
  }

  getSectionHeader(
    name: "phidget" | "main" | "digitalIn" | "digitalOut",
  ): Locator {
    switch (name) {
      case "phidget":
        return this.locator.locator(this.base.selectors.phidgetSectionHeader);
      case "main":
        return this.locator.locator(this.base.selectors.mainSectionHeader);
      case "digitalIn":
        return this.locator.locator(this.base.selectors.digitalInSectionHeader);
      case "digitalOut":
        return this.locator.locator(
          this.base.selectors.digitalOutSectionHeader,
        );
    }
  }

  getSectionContent(
    name: "phidget" | "main" | "digitalIn" | "digitalOut",
  ): Locator {
    switch (name) {
      case "phidget":
        return this.locator.locator(this.base.selectors.phidgetSectionContent);
      case "main":
        return this.locator.locator(this.base.selectors.mainSectionContent);
      case "digitalIn":
        return this.locator.locator(
          this.base.selectors.digitalInSectionContent,
        );
      case "digitalOut":
        return this.locator.locator(
          this.base.selectors.digitalOutSectionContent,
        );
    }
  }

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }

  async toggleSection(
    name: "phidget" | "main" | "digitalIn" | "digitalOut",
  ): Promise<void> {
    await this.getSectionHeader(name).click();
  }

  async isSectionExpanded(
    name: "phidget" | "main" | "digitalIn" | "digitalOut",
  ): Promise<boolean> {
    const content = this.getSectionContent(name);
    return (await content.count()) > 0 && (await content.isVisible());
  }

  async getSelectedDevice(): Promise<string> {
    return await this.deviceSelect.inputValue();
  }

  async removeInterface(): Promise<void> {
    await this.removeButton.click();
  }

  private get pitBehaviorSelect(): Locator {
    return this.locator.locator(this.base.selectors.pitBehaviorSelect).first();
  }

  async getLapPinPitBehavior(): Promise<number> {
    const value =
      (await this.pitBehaviorSelect.getAttribute("data-value")) || "0";
    return Number(value);
  }

  async setLapPinPitBehavior(value: number): Promise<void> {
    await this.pitBehaviorSelect.locator(".custom-select-trigger").click();
    await this.pitBehaviorSelect
      .locator(`.custom-select-option[data-value="${value}"]`)
      .click();
  }
}
