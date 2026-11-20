import { Locator, Page } from "@playwright/test";

/** Drives the redesigned Widget Configuration panel (app-inspector-shell) in Playwright tests. */
export class InspectorKitHarnessE2e {
  readonly panel: Locator;

  constructor(private page: Page) {
    this.panel = page.locator("app-inspector-shell .kit-panel");
  }

  async waitForForm(): Promise<void> {
    await this.panel
      .locator("app-inspector-form")
      .waitFor({ state: "visible" });
  }

  /** Opens a folder (content, text, frame, layout, behaviour) if it is closed. */
  async openFolder(id: string): Promise<void> {
    const folder = this.page.locator(`[data-folder="${id}"]`);
    if (!(await folder.evaluate((el) => el.classList.contains("open")))) {
      await this.page.locator(`#kit-folder-${id}`).click();
    }
  }

  /** Opens a text part (Time, Header, Value...) if it is collapsed. */
  async openPart(id: string): Promise<void> {
    const head = this.page.locator(`[data-field="${id}"] .kit-part-head`);
    if ((await head.getAttribute("aria-expanded")) === "false") {
      await head.click();
    }
  }

  async setPartSize(id: string, size: number): Promise<void> {
    await this.openPart(id);
    const input = this.page.locator(`#kit-${id}-size`);
    await input.fill(String(size));
    await input.press("Tab");
  }

  async fillText(fieldId: string, value: string): Promise<void> {
    const input = this.page.locator(`#kit-${fieldId}`);
    await input.fill(value);
    await input.press("Tab");
  }

  async toggle(fieldId: string): Promise<void> {
    await this.page.locator(`#kit-${fieldId}`).click();
  }

  /** Blurs the focused control, clears hover and scrolls the given element to the top of the panel. */
  async settle(scrollTo?: string): Promise<void> {
    await this.page.evaluate((sel) => {
      (document.activeElement as HTMLElement)?.blur();
      if (sel) {
        document
          .querySelector(sel)
          ?.scrollIntoView({ block: "start", inline: "nearest" });
      }
    }, scrollTo ?? null);
    await this.page.mouse.move(0, 0);
  }
}
