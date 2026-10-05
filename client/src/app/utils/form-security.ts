/**
 * Global form security utility to prevent password managers (Dashlane, 1Password,
 * LastPass, Bitwarden) and browser autofill from hijacking non-credential text inputs.
 */

export const FORM_SECURITY_ATTRIBUTES: Record<string, string> = {
  autocomplete: "off",
  "data-dashlane-ignore": "true",
  "data-dashlane-disabled-on-field": "true",
  "data-1p-ignore": "true",
  "data-lpignore": "true",
  "data-bwignore": "true",
  "data-form-type": "other",
  "data-field-type": "other",
};

const SKIP_INPUT_TYPES = new Set([
  "password",
  "checkbox",
  "radio",
  "file",
  "color",
  "range",
  "hidden",
  "submit",
  "button",
  "reset",
  "image",
]);

/**
 * Applies password manager ignore and autofill disabling attributes to a single element
 * if it is an input (non-credential, non-toggle) or textarea.
 */
export function secureFormElement(el: Element | null | undefined): void {
  if (!el || !el.tagName) {
    return;
  }
  const tag = el.tagName.toLowerCase();
  if (tag !== "input" && tag !== "textarea") {
    return;
  }
  if (tag === "input") {
    const inputType = (el.getAttribute("type") || "text").toLowerCase();
    if (SKIP_INPUT_TYPES.has(inputType)) {
      return;
    }
  }

  for (const [attr, val] of Object.entries(FORM_SECURITY_ATTRIBUTES)) {
    if (
      !el.hasAttribute(attr) ||
      (attr === "autocomplete" && el.getAttribute(attr) !== "off")
    ) {
      el.setAttribute(attr, val);
    }
  }
}

/**
 * Scans an element and all of its descendants, securing all matching input/textarea elements.
 */
export function scanAndSecureNode(node: Node | null | undefined): void {
  if (!node || node.nodeType !== Node.ELEMENT_NODE) {
    return;
  }
  const el = node as Element;
  secureFormElement(el);
  if (el.querySelectorAll) {
    const inputs = el.querySelectorAll("input, textarea");
    for (let i = 0; i < inputs.length; i++) {
      secureFormElement(inputs[i]);
    }
  }
}

/**
 * Initializes global autofill and password manager protection on the specified document.
 * Sets up a MutationObserver on documentElement and capture event listeners on focus/pointer.
 */
export function initGlobalFormSecurity(
  targetDocument: Document = document,
): MutationObserver | null {
  if (!targetDocument || !targetDocument.documentElement) {
    return null;
  }

  // Prevent multiple initializations on the same document
  const docAny = targetDocument as unknown as {
    __rcAiFormSecurityInitialized?: boolean;
  };
  if (docAny.__rcAiFormSecurityInitialized) {
    return null;
  }
  docAny.__rcAiFormSecurityInitialized = true;

  // Secure any elements already present in the DOM
  scanAndSecureNode(targetDocument.documentElement);

  // Observe all DOM mutations for newly added inputs or forms
  const observer = new MutationObserver((mutations: MutationRecord[]) => {
    for (const mutation of mutations) {
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        scanAndSecureNode(mutation.addedNodes[i]);
      }
    }
  });

  observer.observe(targetDocument.documentElement, {
    childList: true,
    subtree: true,
  });

  // Secondary defense: capture focusin and pointerdown before extensions process the event
  const secureTarget = (e: Event): void => {
    if (e.target && (e.target as Element).nodeType === Node.ELEMENT_NODE) {
      secureFormElement(e.target as Element);
    }
  };

  targetDocument.addEventListener("focusin", secureTarget, true);
  targetDocument.addEventListener("pointerdown", secureTarget, true);

  return observer;
}
