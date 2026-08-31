import { CustomUI } from "@app/models/custom-ui";
import { Theme } from "@app/models/theme";
import { TranslationService } from "@app/services/translation.service";

import {
  buildDuplicateEntityName,
  getCustomUiDisplayNameKey,
  getThemeDisplayNameKey,
  isCustomUiDefault,
  isCustomUiNameInvalid,
  isThemeDefault,
  isThemeNameDuplicate,
  isThemeNameInvalid,
} from "./ui-editor-crud.helper";

describe("ui-editor-crud.helper", () => {
  it("should identify default and custom themes correctly", () => {
    const defaultTheme: Theme = {
      entity_id: "default_classic_rc_ai",
      name: "Classic",
      is_default: true,
      slots: {},
      audio_slots: {},
    };
    expect(isThemeDefault(defaultTheme)).toBeTrue();

    const customTheme: Theme = {
      entity_id: "custom_theme_1",
      name: "My Custom Theme",
      is_default: false,
      slots: {},
      audio_slots: {},
    };
    expect(isThemeDefault(customTheme)).toBeFalse();
  });

  it("should get localized theme display name key", () => {
    const classicTheme: Theme = {
      entity_id: "default_classic_rc_ai",
      name: "Classic",
      is_default: true,
      slots: {},
      audio_slots: {},
    };
    expect(getThemeDisplayNameKey(classicTheme)).toBe("UE_LABEL_DEFAULT_THEME");

    const practiceTheme: Theme = {
      entity_id: "practice_theme_rc_ai",
      name: "Practice",
      is_default: true,
      slots: {},
      audio_slots: {},
    };
    expect(getThemeDisplayNameKey(practiceTheme)).toBe(
      "UE_LABEL_PRACTICE_THEME",
    );

    const fuelTheme: Theme = {
      entity_id: "default_fuel_theme_rc_ai",
      name: "Fuel",
      is_default: true,
      slots: {},
      audio_slots: {},
    };
    expect(getThemeDisplayNameKey(fuelTheme)).toBe("UE_LABEL_FUEL_THEME");

    const customTheme: Theme = {
      entity_id: "custom_1",
      name: "My Custom",
      is_default: false,
      slots: {},
      audio_slots: {},
    };
    expect(getThemeDisplayNameKey(customTheme)).toBe("My Custom");
  });

  it("should validate theme names for emptiness and duplicates", () => {
    const t1: Theme = {
      entity_id: "t1",
      name: "Theme One",
      is_default: false,
      slots: {},
      audio_slots: {},
    };

    const t2: Theme = {
      entity_id: "t2",
      name: "Theme Two",
      is_default: false,
      slots: {},
      audio_slots: {},
    };

    expect(isThemeNameInvalid(t1, [t1, t2])).toBeFalse();

    const t3: Theme = {
      entity_id: "t3",
      name: "   ",
      is_default: false,
      slots: {},
      audio_slots: {},
    };
    expect(isThemeNameInvalid(t3, [t1, t2, t3])).toBeTrue();

    const t4: Theme = {
      entity_id: "t4",
      name: "theme one",
      is_default: false,
      slots: {},
      audio_slots: {},
    };
    expect(isThemeNameDuplicate(t4, [t1, t2])).toBeTrue();
  });

  it("should identify default and custom UIs correctly and validate names", () => {
    const defaultUi: CustomUI = {
      entity_id: "default_ui_layout_rc_ai",
      name: "Default UI Layout",
      is_default: true,
    };
    expect(isCustomUiDefault(defaultUi)).toBeTrue();
    expect(getCustomUiDisplayNameKey(defaultUi)).toBe(
      "UE_LABEL_DEFAULT_RACEDAY_UI",
    );

    const practiceUi: CustomUI = {
      entity_id: "practice_ui_layout_rc_ai",
      name: "Default Practice UI Layout",
      is_default: true,
    };
    expect(getCustomUiDisplayNameKey(practiceUi)).toBe(
      "UE_LABEL_DEFAULT_PRACTICE_UI",
    );

    const fuelUi: CustomUI = {
      entity_id: "default_fuel_ui_layout_rc_ai",
      name: "Default Fuel UI Layout",
      is_default: true,
    };
    expect(isCustomUiDefault(fuelUi)).toBeTrue();
    expect(getCustomUiDisplayNameKey(fuelUi)).toBe("UE_LABEL_DEFAULT_FUEL_UI");

    const customUi: CustomUI = {
      entity_id: "custom_ui_1",
      name: "My Layout",
      is_default: false,
    };
    expect(isCustomUiDefault(customUi)).toBeFalse();
    expect(getCustomUiDisplayNameKey(customUi)).toBe("My Layout");

    expect(isCustomUiNameInvalid(customUi, [customUi])).toBeFalse();

    const invalidUi: CustomUI = {
      entity_id: "custom_ui_invalid",
      name: "  ",
      is_default: false,
    };
    expect(isCustomUiNameInvalid(invalidUi, [customUi, invalidUi])).toBeTrue();
  });

  it("should build duplicate entity name using translation service", () => {
    const translationServiceSpy = jasmine.createSpyObj<TranslationService>(
      "TranslationService",
      ["translate"],
    );
    translationServiceSpy.translate.and.callFake((key: string) => {
      if (key === "UE_LABEL_DEFAULT_RACEDAY_UI") return "Default UI Layout";
      if (key === "UE_LABEL_COPY_SUFFIX") return " (Copy)";
      return key;
    });

    const dupName = buildDuplicateEntityName(
      "Default UI Layout",
      true,
      "UE_LABEL_DEFAULT_RACEDAY_UI",
      translationServiceSpy,
    );
    expect(dupName).toBe("Default UI Layout (Copy)");
  });
});
