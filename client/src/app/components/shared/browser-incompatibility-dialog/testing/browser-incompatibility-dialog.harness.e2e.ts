import { Locator } from "@playwright/test";

export class BrowserIncompatibilityDialogHarnessE2e {
  static readonly hostSelector = "#rc-unsupported-browser-overlay";
  static readonly selectors = {
    card: ".rc-unsupported-card",
    icon: ".rc-unsupported-icon",
    title: ".rc-unsupported-title",
    description: ".rc-unsupported-desc",
    requirements: ".rc-unsupported-reqs",
    learnMore: ".rc-unsupported-learn-more",
  };

  constructor(private locator: Locator) {}

  get overlay(): Locator {
    return this.locator;
  }

  get card(): Locator {
    return this.locator.locator(
      BrowserIncompatibilityDialogHarnessE2e.selectors.card,
    );
  }

  get icon(): Locator {
    return this.locator.locator(
      BrowserIncompatibilityDialogHarnessE2e.selectors.icon,
    );
  }

  get title(): Locator {
    return this.locator.locator(
      BrowserIncompatibilityDialogHarnessE2e.selectors.title,
    );
  }

  get description(): Locator {
    return this.locator.locator(
      BrowserIncompatibilityDialogHarnessE2e.selectors.description,
    );
  }

  get requirements(): Locator {
    return this.locator.locator(
      BrowserIncompatibilityDialogHarnessE2e.selectors.requirements,
    );
  }

  get learnMore(): Locator {
    return this.locator.locator(
      BrowserIncompatibilityDialogHarnessE2e.selectors.learnMore,
    );
  }

  async waitForVisible(timeout = 10000): Promise<void> {
    await this.card.waitFor({ state: "visible", timeout });
  }

  async isVisible(): Promise<boolean> {
    return await this.card.isVisible();
  }

  async getTitleText(): Promise<string> {
    return await this.title.innerText();
  }

  async getDescriptionText(): Promise<string> {
    return await this.description.innerText();
  }

  async getRequirementsText(): Promise<string> {
    return await this.requirements.innerText();
  }

  async getLearnMoreText(): Promise<string> {
    return await this.learnMore.innerText();
  }
}
