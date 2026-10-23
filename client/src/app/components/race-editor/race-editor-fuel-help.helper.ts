import { GuideStep } from "@app/services/help.service";
import { TranslationService } from "@app/services/translation.service";

export class RaceEditorFuelHelpHelper {
  static getAnalogFuelRateHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      {
        selector: "#fuel-enabled-input",
        title: translationService.translate("RE_HELP_FUEL_ENABLED_TITLE"),
        content: translationService.translate("RE_HELP_FUEL_ENABLED_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_analog) {
            sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-usage-type-select",
        title: translationService.translate("RE_HELP_FUEL_USAGE_TYPE_TITLE"),
        content: translationService.translate(
          "RE_HELP_FUEL_USAGE_TYPE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_analog) {
            sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-fastest-time-input",
        title: translationService.translate("RE_HELP_FUEL_FASTEST_TIME_TITLE"),
        content: translationService.translate(
          "RE_HELP_FUEL_FASTEST_TIME_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_analog) {
            sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-slowest-time-input",
        title: translationService.translate("RE_HELP_FUEL_SLOWEST_TIME_TITLE"),
        content: translationService.translate(
          "RE_HELP_FUEL_SLOWEST_TIME_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_analog) {
            sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-max-usage-input",
        title: translationService.translate("RE_HELP_FUEL_MAX_USAGE_TITLE"),
        content: translationService.translate("RE_HELP_FUEL_MAX_USAGE_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_analog) {
            sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-min-usage-input",
        title: translationService.translate("RE_HELP_FUEL_MIN_USAGE_TITLE"),
        content: translationService.translate("RE_HELP_FUEL_MIN_USAGE_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_analog) {
            sectionsExpanded.fuel_analog = true;
          }
        },
      },
    ];
  }
  static getAnalogFuelTankHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      {
        selector: "#fuel-capacity-input",
        title: translationService.translate("RE_HELP_FUEL_CAPACITY_TITLE"),
        content: translationService.translate("RE_HELP_FUEL_CAPACITY_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_analog) {
            sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-start-level-input",
        title: translationService.translate("RE_HELP_FUEL_START_LEVEL_TITLE"),
        content: translationService.translate(
          "RE_HELP_FUEL_START_LEVEL_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_analog) {
            sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-refuel-rate-input",
        title: translationService.translate("RE_HELP_FUEL_REFUEL_RATE_TITLE"),
        content: translationService.translate(
          "RE_HELP_FUEL_REFUEL_RATE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_analog) {
            sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-pit-delay-input",
        title: translationService.translate("RE_HELP_FUEL_PIT_DELAY_TITLE"),
        content: translationService.translate("RE_HELP_FUEL_PIT_DELAY_CONTENT"),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_analog) {
            sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-reset-at-start-input",
        title: translationService.translate(
          "RE_HELP_RESET_FUEL_AT_START_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_RESET_FUEL_AT_START_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_analog) {
            sectionsExpanded.fuel_analog = true;
          }
        },
      },
      {
        selector: "#fuel-out-of-fuel-action-select",
        title: translationService.translate("RE_HELP_OUT_OF_FUEL_ACTION_TITLE"),
        content: translationService.translate(
          "RE_HELP_OUT_OF_FUEL_ACTION_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_analog) {
            sectionsExpanded.fuel_analog = true;
          }
        },
      },
    ];
  }
  static getAnalogFuelHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      ...RaceEditorFuelHelpHelper.getAnalogFuelRateHelpSteps(
        translationService,
        sectionsExpanded,
      ),
      ...RaceEditorFuelHelpHelper.getAnalogFuelTankHelpSteps(
        translationService,
        sectionsExpanded,
      ),
    ];
  }
  static getDigitalFuelRateHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      {
        selector: "#digital-fuel-enabled-input",
        title: translationService.translate(
          "RE_HELP_DIGITAL_FUEL_ENABLED_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_DIGITAL_FUEL_ENABLED_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_digital) {
            sectionsExpanded.fuel_digital = true;
          }
        },
      },
      {
        selector: "#digital-fuel-usage-type-select",
        title: translationService.translate(
          "RE_HELP_DIGITAL_FUEL_USAGE_TYPE_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_DIGITAL_FUEL_USAGE_TYPE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_digital) {
            sectionsExpanded.fuel_digital = true;
          }
        },
      },
      {
        selector: "#digital-fuel-usage-rate-input",
        title: translationService.translate(
          "RE_HELP_DIGITAL_FUEL_USAGE_RATE_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_DIGITAL_FUEL_USAGE_RATE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_digital) {
            sectionsExpanded.fuel_digital = true;
          }
        },
      },
      {
        selector: "#digital-fuel-capacity-input",
        title: translationService.translate(
          "RE_HELP_DIGITAL_FUEL_CAPACITY_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_DIGITAL_FUEL_CAPACITY_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_digital) {
            sectionsExpanded.fuel_digital = true;
          }
        },
      },
    ];
  }
  static getDigitalFuelTankHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      {
        selector: "#digital-fuel-start-level-input",
        title: translationService.translate(
          "RE_HELP_DIGITAL_FUEL_START_LEVEL_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_DIGITAL_FUEL_START_LEVEL_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_digital) {
            sectionsExpanded.fuel_digital = true;
          }
        },
      },
      {
        selector: "#digital-fuel-refuel-rate-input",
        title: translationService.translate(
          "RE_HELP_DIGITAL_FUEL_REFUEL_RATE_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_DIGITAL_FUEL_REFUEL_RATE_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_digital) {
            sectionsExpanded.fuel_digital = true;
          }
        },
      },
      {
        selector: "#digital-fuel-pit-delay-input",
        title: translationService.translate(
          "RE_HELP_DIGITAL_FUEL_PIT_DELAY_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_DIGITAL_FUEL_PIT_DELAY_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_digital) {
            sectionsExpanded.fuel_digital = true;
          }
        },
      },
      {
        selector: "#digital-fuel-reset-at-start-input",
        title: translationService.translate(
          "RE_HELP_DIGITAL_RESET_FUEL_AT_START_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_DIGITAL_RESET_FUEL_AT_START_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_digital) {
            sectionsExpanded.fuel_digital = true;
          }
        },
      },
      {
        selector: "#digital-fuel-out-of-fuel-action-select",
        title: translationService.translate(
          "RE_HELP_DIGITAL_OUT_OF_FUEL_ACTION_TITLE",
        ),
        content: translationService.translate(
          "RE_HELP_DIGITAL_OUT_OF_FUEL_ACTION_CONTENT",
        ),
        position: "bottom",
        onEnter: () => {
          if (!sectionsExpanded.fuel_digital) {
            sectionsExpanded.fuel_digital = true;
          }
        },
      },
    ];
  }
  static getDigitalFuelHelpSteps(
    translationService: TranslationService,
    sectionsExpanded: any,
  ): GuideStep[] {
    return [
      ...RaceEditorFuelHelpHelper.getDigitalFuelRateHelpSteps(
        translationService,
        sectionsExpanded,
      ),
      ...RaceEditorFuelHelpHelper.getDigitalFuelTankHelpSteps(
        translationService,
        sectionsExpanded,
      ),
    ];
  }
}
