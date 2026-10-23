import { buildArduinoHelpSteps } from "./arduino-editor-help.helper";

describe("arduino-editor-help.helper", () => {
  it("builds help steps with and without led strings", () => {
    let mainExpanded = false;
    let digitalExpanded = false;
    let analogExpanded = false;
    let voltageExpanded = false;
    let ledsExpanded = false;

    const steps = buildArduinoHelpSteps({
      index: 0,
      availablePins: [2, 3, 4],
      availableAnalogPins: [0, 1],
      voltageLanes: [0, 1],
      ledStrings: [{ pin: 2 } as any],
      expandMain: () => (mainExpanded = true),
      expandDigital: () => (digitalExpanded = true),
      expandAnalog: () => (analogExpanded = true),
      expandVoltage: () => (voltageExpanded = true),
      expandLeds: () => (ledsExpanded = true),
    });

    expect(steps.length).toBeGreaterThan(5);

    // Test onEnter callbacks
    const mainStep = steps.find((s) => s.selector === "#arduino-board-type-0");
    mainStep?.onEnter?.();
    expect(mainExpanded).toBeTrue();

    const digitalStep = steps.find(
      (s) => s.selector === "#arduino-digital-selector-4",
    );
    digitalStep?.onEnter?.();
    expect(digitalExpanded).toBeTrue();

    const analogStep = steps.find(
      (s) => s.selector === "#arduino-analog-selector-0",
    );
    analogStep?.onEnter?.();
    expect(analogExpanded).toBeTrue();

    const voltageStep = steps.find(
      (s) => s.selector === "#arduino-voltage-section-0",
    );
    voltageStep?.onEnter?.();
    expect(voltageExpanded).toBeTrue();

    const ledsStep = steps.find((s) => s.selector === "#arduino-led-section-0");
    ledsStep?.onEnter?.();
    expect(ledsExpanded).toBeTrue();
  });
});
