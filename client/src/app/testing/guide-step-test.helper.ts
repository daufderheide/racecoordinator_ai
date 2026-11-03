import { ComponentFixture } from "@angular/core/testing";
import { GuideStep } from "@app/services/help.service";

export interface GuideStepValidationOptions {
  /** Optional root element or selector to search within, defaults to fixture.nativeElement */
  rootElement?: HTMLElement;
  /** Whether to verify document as fallback if element not found in fixture root (e.g. portal elements) */
  checkDocumentFallback?: boolean;
}

export class GuideStepTestHelper {
  /**
   * Verifies that every step in the given steps array has valid title, content,
   * properly structured help-link attributes if links are present, and that its
   * targetId or selector resolves to an actual element in the rendered DOM.
   */
  static verifyGuideStepsExistInDom(
    fixture: ComponentFixture<any>,
    steps: GuideStep[],
    options: GuideStepValidationOptions = {},
  ): void {
    expect(steps).toBeDefined();
    expect(steps.length).toBeGreaterThan(0);

    const root: HTMLElement = options.rootElement || fixture.nativeElement;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepLabel = `Step ${i + 1} ("${step.title || "Untitled"}")`;

      // 1. Basic content assertions
      expect(step.title)
        .withContext(`${stepLabel}: title must be non-empty string`)
        .toBeTruthy();
      expect(step.content)
        .withContext(`${stepLabel}: content must be non-empty string`)
        .toBeTruthy();

      // 2. Validate help-link structure if present in content HTML
      if (step.content.includes("help-link")) {
        this.verifyHelpLinksInContent(step.content, stepLabel);
      }

      // 3. Execute onEnter lifecycle hook if present
      step.onEnter?.();
      fixture.detectChanges();

      // 4. If step targets an element by targetId or selector, verify its existence
      if (step.targetId) {
        let el = root.querySelector(`#${step.targetId}`);
        if (!el && options.checkDocumentFallback) {
          el = document.getElementById(step.targetId);
        }
        expect(el)
          .withContext(
            `${stepLabel}: element with targetId "#${step.targetId}" must exist in the rendered DOM`,
          )
          .not.toBeNull();
      }

      if (step.selector) {
        let el = root.querySelector(step.selector);
        if (!el && options.checkDocumentFallback) {
          el = document.querySelector(step.selector);
        }
        expect(el)
          .withContext(
            `${stepLabel}: element matching selector "${step.selector}" must exist in the rendered DOM`,
          )
          .not.toBeNull();
      }

      // 5. Clean up by running onLeave hook if present
      step.onLeave?.();
    }
  }

  /**
   * Verifies that any <a class="help-link"> contains valid help-article-<name> class
   * and optional help-section-<name> class matching kebab-case naming.
   */
  static verifyHelpLinksInContent(
    content: string,
    contextDescription = "Content",
  ): void {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const links = tempDiv.querySelectorAll("a.help-link");

    expect(links.length)
      .withContext(
        `${contextDescription}: found "help-link" text but no <a> element matched`,
      )
      .toBeGreaterThan(0);

    links.forEach((link, idx) => {
      const classList = Array.from(link.classList);
      const articleClass = classList.find((c) => c.startsWith("help-article-"));
      expect(articleClass)
        .withContext(
          `${contextDescription} link #${idx + 1}: must have a "help-article-<article>" class`,
        )
        .toBeDefined();

      if (articleClass) {
        const articleName = articleClass.replace("help-article-", "");
        expect(articleName.length)
          .withContext(
            `${contextDescription} link #${idx + 1}: article name must not be empty`,
          )
          .toBeGreaterThan(0);
        expect(/^[a-z0-9-]+$/.test(articleName))
          .withContext(
            `${contextDescription} link #${idx + 1}: article name "${articleName}" must be kebab-case`,
          )
          .toBeTrue();
      }

      const sectionClass = classList.find((c) => c.startsWith("help-section-"));
      if (sectionClass) {
        const sectionName = sectionClass.replace("help-section-", "");
        expect(sectionName.length)
          .withContext(
            `${contextDescription} link #${idx + 1}: section name must not be empty`,
          )
          .toBeGreaterThan(0);
        expect(/^[a-z0-9-]+$/.test(sectionName))
          .withContext(
            `${contextDescription} link #${idx + 1}: section name "${sectionName}" must be kebab-case`,
          )
          .toBeTrue();
      }
    });
  }
}
