import {
  FORM_SECURITY_ATTRIBUTES,
  initGlobalFormSecurity,
  scanAndSecureNode,
  secureFormElement,
} from "./form-security";

describe("form-security", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe("secureFormElement", () => {
    it("should do nothing for null or undefined", () => {
      expect(() => secureFormElement(null)).not.toThrow();
      expect(() => secureFormElement(undefined)).not.toThrow();
    });

    it("should do nothing for non-input/non-textarea elements", () => {
      const div = document.createElement("div");
      secureFormElement(div);
      expect(div.getAttribute("autocomplete")).toBeNull();
      expect(div.getAttribute("data-dashlane-ignore")).toBeNull();
    });

    it("should apply all security attributes to text input", () => {
      const input = document.createElement("input");
      input.type = "text";
      secureFormElement(input);

      for (const [attr, val] of Object.entries(FORM_SECURITY_ATTRIBUTES)) {
        expect(input.getAttribute(attr)).toBe(val);
      }
    });

    it("should apply all security attributes to textarea", () => {
      const textarea = document.createElement("textarea");
      secureFormElement(textarea);

      for (const [attr, val] of Object.entries(FORM_SECURITY_ATTRIBUTES)) {
        expect(textarea.getAttribute(attr)).toBe(val);
      }
    });

    it("should apply security attributes to number and search inputs", () => {
      const numberInput = document.createElement("input");
      numberInput.type = "number";
      secureFormElement(numberInput);
      expect(numberInput.getAttribute("data-dashlane-disabled-on-field")).toBe(
        "true",
      );

      const searchInput = document.createElement("input");
      searchInput.type = "search";
      secureFormElement(searchInput);
      expect(searchInput.getAttribute("data-dashlane-disabled-on-field")).toBe(
        "true",
      );
    });

    it("should skip password, checkbox, radio, file, color, and hidden inputs", () => {
      const types = [
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
      ];
      for (const type of types) {
        const input = document.createElement("input");
        input.type = type;
        secureFormElement(input);
        expect(
          input.getAttribute("data-dashlane-disabled-on-field"),
        ).toBeNull();
        expect(input.getAttribute("data-1p-ignore")).toBeNull();
      }
    });
  });

  describe("scanAndSecureNode", () => {
    it("should secure node and its descendant inputs", () => {
      container.innerHTML = `
        <div>
          <input type="text" id="test-name" />
          <textarea id="test-desc"></textarea>
          <input type="checkbox" id="test-check" />
        </div>
      `;

      scanAndSecureNode(container);

      const textInput = container.querySelector(
        "#test-name",
      ) as HTMLInputElement;
      const textarea = container.querySelector(
        "#test-desc",
      ) as HTMLTextAreaElement;
      const checkbox = container.querySelector(
        "#test-check",
      ) as HTMLInputElement;

      expect(textInput.getAttribute("data-dashlane-disabled-on-field")).toBe(
        "true",
      );
      expect(textInput.getAttribute("autocomplete")).toBe("off");
      expect(textarea.getAttribute("data-dashlane-disabled-on-field")).toBe(
        "true",
      );
      expect(
        checkbox.getAttribute("data-dashlane-disabled-on-field"),
      ).toBeNull();
    });
  });

  describe("initGlobalFormSecurity", () => {
    it("should initialize idempotent global protection and observe additions", (done) => {
      initGlobalFormSecurity(document);
      // Calling second time returns null due to idempotence
      const secondCall = initGlobalFormSecurity(document);
      expect(secondCall).toBeNull();

      const newInput = document.createElement("input");
      newInput.type = "text";
      newInput.id = "async-added-input";
      container.appendChild(newInput);

      // MutationObserver runs on next microtask
      setTimeout(() => {
        expect(newInput.getAttribute("data-dashlane-disabled-on-field")).toBe(
          "true",
        );
        expect(newInput.getAttribute("data-field-type")).toBe("other");
        expect(newInput.getAttribute("autocomplete")).toBe("off");
        done();
      }, 50);
    });

    it("should secure on focusin event as secondary defense", () => {
      const unattachedInput = document.createElement("input");
      unattachedInput.type = "text";
      container.appendChild(unattachedInput);

      // Remove attributes to simulate freshly injected element before observer
      unattachedInput.removeAttribute("data-dashlane-disabled-on-field");
      expect(
        unattachedInput.getAttribute("data-dashlane-disabled-on-field"),
      ).toBeNull();

      const event = new Event("focusin", { bubbles: true });
      unattachedInput.dispatchEvent(event);

      expect(
        unattachedInput.getAttribute("data-dashlane-disabled-on-field"),
      ).toBe("true");
    });
  });
});
