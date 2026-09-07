import { formatUnsavedChangesMessage } from "./unsaved-changes.helper";

describe("unsavedChangesHelper", () => {
  let mockTranslationService: any;

  beforeEach(() => {
    mockTranslationService = {
      translate: jasmine.createSpy("translate").and.callFake((key: string) => {
        const translations: Record<string, string> = {
          UE_CONFIRM_DISCARD_MESSAGE:
            "You have unsaved changes. Are you sure you want to discard them?",
          DISCARD_REASONS_HEADER:
            "Your changes could not be saved for the following reason(s):",
          DISCARD_CONFIRM_PROMPT:
            "Are you sure you want to discard your changes?",
          DISCARD_REASON_DRIVER_NICKNAME_EMPTY:
            "Driver nickname cannot be empty.",
          DISCARD_REASON_DRIVER_NAME_DUPLICATE: "Driver name already exists.",
        };
        return translations[key] || key;
      }),
    };
  });

  it("should return default confirm discard message when reasonKeys is empty", () => {
    const result = formatUnsavedChangesMessage(mockTranslationService, []);
    expect(result).toBe(
      "You have unsaved changes. Are you sure you want to discard them?",
    );
    expect(mockTranslationService.translate).toHaveBeenCalledWith(
      "UE_CONFIRM_DISCARD_MESSAGE",
    );
  });

  it("should return formatted message with a single reason", () => {
    const result = formatUnsavedChangesMessage(mockTranslationService, [
      "DISCARD_REASON_DRIVER_NICKNAME_EMPTY",
    ]);
    expect(result).toBe(
      "Your changes could not be saved for the following reason(s):\n" +
        "• Driver nickname cannot be empty.\n\n" +
        "Are you sure you want to discard your changes?",
    );
  });

  it("should return formatted message with multiple reasons", () => {
    const result = formatUnsavedChangesMessage(mockTranslationService, [
      "DISCARD_REASON_DRIVER_NAME_DUPLICATE",
      "DISCARD_REASON_DRIVER_NICKNAME_EMPTY",
    ]);
    expect(result).toBe(
      "Your changes could not be saved for the following reason(s):\n" +
        "• Driver name already exists.\n" +
        "• Driver nickname cannot be empty.\n\n" +
        "Are you sure you want to discard your changes?",
    );
  });
});
