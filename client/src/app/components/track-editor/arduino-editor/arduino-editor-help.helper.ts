import { GuideStep } from "@app/services/help.service";

export interface ArduinoEditorHelpContext {
  index: number;
  availablePins?: number[];
  availableAnalogPins?: number[];
  voltageLanes: number[];
  ledStrings?: any[];
  expandMain: () => void;
  expandDigital: () => void;
  expandAnalog: () => void;
  expandVoltage: () => void;
  expandLeds: () => void;
}

function getMainHelpSteps(index: number, expandMain: () => void): GuideStep[] {
  return [
    {
      selector: `#arduino-board-type-${index}`,
      title: "TE_HELP_ARDUINO_BOARD_TYPE_TITLE",
      content: "TE_HELP_ARDUINO_BOARD_TYPE_CONTENT",
      position: "bottom",
      onEnter: expandMain,
    },
    {
      selector: `#arduino-com-port-${index}`,
      title: "TE_HELP_ARDUINO_COM_PORT_TITLE",
      content: "TE_HELP_ARDUINO_COM_PORT_CONTENT",
      position: "bottom",
      onEnter: expandMain,
    },
    {
      selector: `#arduino-status-badge-${index}`,
      title: "TE_HELP_ARDUINO_STATUS_TITLE",
      content: "TE_HELP_ARDUINO_STATUS_CONTENT",
      position: "right",
      onEnter: expandMain,
    },
    {
      selector: `#arduino-debounce-${index}`,
      title: "TE_HELP_ARDUINO_DEBOUNCE_TITLE",
      content: "TE_HELP_ARDUINO_DEBOUNCE_CONTENT",
      position: "bottom",
      onEnter: expandMain,
    },
    {
      selector: `#arduino-pit-behavior-${index}`,
      title: "TE_HELP_ARDUINO_PIT_BEHAVIOR_TITLE",
      content: "TE_HELP_ARDUINO_PIT_BEHAVIOR_CONTENT",
      position: "bottom",
      onEnter: expandMain,
    },
    {
      selector: `#arduino-nc-sensors-${index}`,
      title: "TE_HELP_ARDUINO_NC_SENSORS_TITLE",
      content: "TE_HELP_ARDUINO_NC_SENSORS_CONTENT",
      position: "bottom",
      onEnter: expandMain,
    },
    {
      selector: `#arduino-nc-relays-${index}`,
      title: "TE_HELP_ARDUINO_NC_RELAYS_TITLE",
      content: "TE_HELP_ARDUINO_NC_RELAYS_CONTENT",
      position: "bottom",
      onEnter: expandMain,
    },
    {
      selector: `#arduino-active-low-analog-leds-${index}`,
      title: "TE_HELP_ARDUINO_ACTIVE_LOW_LEDS_TITLE",
      content: "TE_HELP_ARDUINO_ACTIVE_LOW_LEDS_CONTENT",
      position: "bottom",
      onEnter: expandMain,
    },
  ];
}

function getPinHelpSteps(
  digitalPin: number,
  analogPin: number,
  expandDigital: () => void,
  expandAnalog: () => void,
): GuideStep[] {
  return [
    {
      selector: `#arduino-digital-selector-${digitalPin}`,
      title: "TE_HELP_ARDUINO_PIN_SELECTOR_TITLE",
      content: "TE_HELP_ARDUINO_PIN_SELECTOR_CONTENT",
      position: "bottom",
      onEnter: expandDigital,
    },
    {
      selector: `#arduino-digital-status-${digitalPin}`,
      title: "TE_HELP_ARDUINO_PIN_STATUS_TITLE",
      content: "TE_HELP_ARDUINO_PIN_STATUS_CONTENT",
      position: "bottom",
      onEnter: expandDigital,
    },
    {
      selector: `#arduino-analog-selector-${analogPin}`,
      title: "TE_HELP_ARDUINO_ANALOG_SELECTOR_TITLE",
      content: "TE_HELP_ARDUINO_ANALOG_SELECTOR_CONTENT",
      position: "bottom",
      onEnter: expandAnalog,
    },
    {
      selector: `#arduino-analog-status-${analogPin}`,
      title: "TE_HELP_ARDUINO_ANALOG_STATUS_TITLE",
      content: "TE_HELP_ARDUINO_ANALOG_STATUS_CONTENT",
      position: "bottom",
      onEnter: expandAnalog,
    },
  ];
}

function getVoltageHelpSteps(
  index: number,
  voltageLanes: number[],
  expandVoltage: () => void,
): GuideStep[] {
  const steps: GuideStep[] = [
    {
      selector: `#arduino-voltage-section-${index}`,
      title: "TE_HELP_ARDUINO_VOLTAGE_TITLE",
      content: "TE_HELP_ARDUINO_VOLTAGE_CONTENT",
      position: "top",
      onEnter: expandVoltage,
    },
  ];

  if (voltageLanes.length > 0) {
    const firstLane = voltageLanes[0];
    steps.push(
      {
        selector: `#arduino-voltage-reset-${index}`,
        title: "TE_HELP_ARDUINO_VOLTAGE_RESET_TITLE",
        content: "TE_HELP_ARDUINO_VOLTAGE_RESET_CONTENT",
        position: "bottom",
        onEnter: expandVoltage,
      },
      {
        selector: `#arduino-voltage-max-${index}-${firstLane}`,
        title: "TE_HELP_ARDUINO_VOLTAGE_MAX_TITLE",
        content: "TE_HELP_ARDUINO_VOLTAGE_MAX_CONTENT",
        position: "bottom",
        onEnter: expandVoltage,
      },
      {
        selector: `#arduino-voltage-link-${index}-${firstLane}`,
        title: "TE_HELP_ARDUINO_VOLTAGE_LINK_TITLE",
        content: "TE_HELP_ARDUINO_VOLTAGE_LINK_CONTENT",
        position: "bottom",
        onEnter: expandVoltage,
      },
      {
        selector: `#arduino-voltage-live-${index}-${firstLane}`,
        title: "TE_HELP_ARDUINO_VOLTAGE_LIVE_TITLE",
        content: "TE_HELP_ARDUINO_VOLTAGE_LIVE_CONTENT",
        position: "bottom",
        onEnter: expandVoltage,
      },
      {
        selector: `#arduino-voltage-set-max-${index}-${firstLane}`,
        title: "TE_HELP_ARDUINO_VOLTAGE_SET_MAX_TITLE",
        content: "TE_HELP_ARDUINO_VOLTAGE_SET_MAX_CONTENT",
        position: "bottom",
        onEnter: expandVoltage,
      },
    );
  }

  return steps;
}

function getLedStringDetailHelpSteps(
  index: number,
  expandLeds: () => void,
  hasLeds: boolean,
): GuideStep[] {
  const steps: GuideStep[] = [
    {
      selector: `#arduino-led-string-header-${index}-0`,
      title: "TE_HELP_ARDUINO_LED_STRING_TITLE",
      content: "TE_HELP_ARDUINO_LED_STRING_CONTENT",
      position: "bottom",
      onEnter: expandLeds,
    },
    {
      selector: `#arduino-led-link-${index}-0`,
      title: "TE_HELP_ARDUINO_LED_LINK_TITLE",
      content: "TE_HELP_ARDUINO_LED_LINK_CONTENT",
      position: "bottom",
      onEnter: expandLeds,
    },
    {
      selector: `#arduino-led-count-${index}-0`,
      title: "TE_HELP_ARDUINO_LED_COUNT_TITLE",
      content: "TE_HELP_ARDUINO_LED_COUNT_CONTENT",
      position: "bottom",
      onEnter: expandLeds,
    },
    {
      selector: `#arduino-led-brightness-${index}-0`,
      title: "TE_HELP_ARDUINO_LED_BRIGHTNESS_TITLE",
      content: "TE_HELP_ARDUINO_LED_BRIGHTNESS_CONTENT",
      position: "bottom",
      onEnter: expandLeds,
    },
    {
      selector: `#arduino-led-flash-rate-${index}-0`,
      title: "TE_HELP_ARDUINO_LED_FLASH_RATE_TITLE",
      content: "TE_HELP_ARDUINO_LED_FLASH_RATE_CONTENT",
      position: "bottom",
      onEnter: expandLeds,
    },
    {
      selector: `#arduino-led-type-${index}-0`,
      title: "TE_HELP_ARDUINO_LED_TYPE_TITLE",
      content: "TE_HELP_ARDUINO_LED_TYPE_CONTENT",
      position: "bottom",
      onEnter: expandLeds,
    },
    {
      selector: `#arduino-led-color-order-${index}-0`,
      title: "TE_HELP_ARDUINO_LED_COLOR_ORDER_TITLE",
      content: "TE_HELP_ARDUINO_LED_COLOR_ORDER_CONTENT",
      position: "bottom",
      onEnter: expandLeds,
    },
    {
      selector: `#arduino-led-lane-overrides-${index}-0`,
      title: "TE_HELP_ARDUINO_LED_LANE_OVERRIDES_TITLE",
      content: "TE_HELP_ARDUINO_LED_LANE_OVERRIDES_CONTENT",
      position: "bottom",
      onEnter: expandLeds,
    },
  ];

  if (hasLeds) {
    steps.push(
      {
        selector: `#arduino-led-status-${index}-0-0`,
        title: "TE_HELP_ARDUINO_LED_STATUS_TITLE",
        content: "TE_HELP_ARDUINO_LED_STATUS_CONTENT",
        position: "bottom",
        onEnter: expandLeds,
      },
      {
        selector: `#arduino-led-selector-${index}-0-0`,
        title: "TE_HELP_ARDUINO_LED_SELECTOR_TITLE",
        content: "TE_HELP_ARDUINO_LED_SELECTOR_CONTENT",
        position: "bottom",
        onEnter: expandLeds,
      },
    );
  }

  return steps;
}

function getLedHelpSteps(
  index: number,
  ledStrings: any[] | undefined,
  expandLeds: () => void,
): GuideStep[] {
  const steps: GuideStep[] = [
    {
      selector: `#arduino-led-section-${index}`,
      title: "TE_HELP_ARDUINO_LED_TITLE",
      content: "TE_HELP_ARDUINO_LED_CONTENT",
      position: "top",
      onEnter: expandLeds,
    },
  ];

  if (ledStrings && ledStrings.length > 0) {
    const firstString = ledStrings[0];
    const hasLeds = Boolean(firstString?.leds && firstString.leds.length > 0);
    steps.push(...getLedStringDetailHelpSteps(index, expandLeds, hasLeds));
  }

  return steps;
}

export function buildArduinoHelpSteps(
  ctx: ArduinoEditorHelpContext,
): GuideStep[] {
  const digitalPin = ctx.availablePins?.includes(4)
    ? 4
    : (ctx.availablePins?.[0] ?? 2);
  const analogPin = ctx.availableAnalogPins?.includes(2)
    ? 2
    : (ctx.availableAnalogPins?.[0] ?? 0);

  return [
    ...getMainHelpSteps(ctx.index, ctx.expandMain),
    ...getPinHelpSteps(
      digitalPin,
      analogPin,
      ctx.expandDigital,
      ctx.expandAnalog,
    ),
    ...getVoltageHelpSteps(ctx.index, ctx.voltageLanes, ctx.expandVoltage),
    ...getLedHelpSteps(ctx.index, ctx.ledStrings, ctx.expandLeds),
  ];
}
