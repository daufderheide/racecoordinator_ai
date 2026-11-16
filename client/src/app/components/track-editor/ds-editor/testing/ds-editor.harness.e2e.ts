import { Locator } from "@playwright/test";

import { DsEditorHarnessBase } from "./ds-editor.harness.base";

export class DsEditorHarnessE2e implements DsEditorHarnessBase {
  constructor(private locator: Locator) {}

  async exists(): Promise<boolean> {
    return await this.locator.isVisible();
  }

  getLocator(): Locator {
    return this.locator;
  }

  async toggleSection(section: "ds" | "main" | "lanes"): Promise<void> {
    if (section === "ds") {
      await this.locator.locator(".config-header .toggle-btn").click();
    } else if (section === "main") {
      await this.locator
        .locator(".section-header", { hasText: "Main Configuration" })
        .click();
    } else if (section === "lanes") {
      await this.locator
        .locator(".section-header", { hasText: "Lane Sensors" })
        .click();
    }
  }

  async openTypeDropdown(): Promise<void> {
    const typeSelect = this.locator.locator("app-custom-select").nth(1);
    await typeSelect.locator(".custom-select-trigger").click();
    await typeSelect
      .locator(".custom-select-dropdown")
      .waitFor({ state: "visible" });
  }

  async openPortDropdown(): Promise<void> {
    const portSelect = this.locator.locator("app-custom-select").first();
    await portSelect.locator(".custom-select-trigger").click();
    await portSelect
      .locator(".custom-select-dropdown")
      .waitFor({ state: "visible" });
  }
}
