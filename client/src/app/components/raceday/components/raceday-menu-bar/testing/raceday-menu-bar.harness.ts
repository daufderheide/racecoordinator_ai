import { ComponentHarness } from "@angular/cdk/testing";

import { RacedayMenuBarHarnessBase } from "./raceday-menu-bar.harness.base";

export class RacedayMenuBarHarness
  extends ComponentHarness
  implements RacedayMenuBarHarnessBase
{
  static hostSelector = RacedayMenuBarHarnessBase.hostSelector;

  protected getMenuButtonEls = this.locatorForAll(
    RacedayMenuBarHarnessBase.selectors.menuButton,
  );
  protected getDropdownEls = this.locatorForAll(
    RacedayMenuBarHarnessBase.selectors.dropdown,
  );
  protected getMenuItemEls = this.locatorForAll(
    RacedayMenuBarHarnessBase.selectors.menuItem,
  );

  async clickMenuButton(label: string): Promise<void> {
    const btns = await this.getMenuButtonEls();
    for (const btn of btns) {
      if ((await btn.text()).trim() === label) {
        await btn.click();
        return;
      }
    }
    throw new Error(`Menu button with label "${label}" not found`);
  }

  async clickMenuItem(label: string): Promise<void> {
    const items = await this.getMenuItemEls();
    for (const item of items) {
      if ((await item.text()).trim().includes(label)) {
        await item.click();
        return;
      }
    }
    throw new Error(`Menu item with label "${label}" not found`);
  }

  async isMenuOpen(
    menuType: "file" | "race" | "lanes" | "windows" | "options",
  ): Promise<boolean> {
    // Determine open state by checking matching wrapper states
    const host = await this.host();
    switch (menuType) {
      case "file":
        return await host.hasClass("file-menu-open"); // Wait, does it have a class or properties? Let's check menu-bar component state fields directly in unit spec, or classes
    }
    return false;
  }
}
