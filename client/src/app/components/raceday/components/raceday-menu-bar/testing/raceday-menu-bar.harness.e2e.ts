import { Locator } from "@playwright/test";

import { RacedayMenuBarHarnessBase } from "./raceday-menu-bar.harness.base";

export class RacedayMenuBarHarnessE2e implements RacedayMenuBarHarnessBase {
  constructor(private locator: Locator) {}

  private get base() {
    return RacedayMenuBarHarnessBase;
  }

  private get menuButtons() {
    return this.locator.locator(this.base.selectors.menuButton);
  }

  private get dropdowns() {
    return this.locator.locator(this.base.selectors.dropdown);
  }

  private get menuItems() {
    return this.locator.locator(this.base.selectors.menuItem);
  }

  async clickMenuButton(label: string): Promise<void> {
    const btn = this.menuButtons.filter({ hasText: label }).first();
    await btn.click();
  }

  async clickMenuItem(label: string): Promise<void> {
    const item = this.menuItems.filter({ hasText: label }).first();
    await item.click();
  }

  async isMenuOpen(
    _menuType: "file" | "race" | "lanes" | "windows" | "options",
  ): Promise<boolean> {
    // Check dropdown visibility in E2E
    return await this.dropdowns.first().isVisible();
  }
}
