import { RaceEditorFuelHelpHelper } from "./race-editor-fuel-help.helper";

describe("RaceEditorFuelHelpHelper", () => {
  let mockTranslationService: any;
  let sectionsExpanded: any;

  beforeEach(() => {
    mockTranslationService = {
      translate: jasmine
        .createSpy("translate")
        .and.callFake((key: string) => key),
    };
    sectionsExpanded = {
      fuel_analog: false,
      fuel_digital: false,
    };
  });

  it("should return analog fuel rate help steps and expand fuel_analog section onEnter", () => {
    const steps = RaceEditorFuelHelpHelper.getAnalogFuelRateHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].selector).toBe("#fuel-enabled-input");
    steps[0].onEnter?.();
    expect(sectionsExpanded.fuel_analog).toBeTrue();
  });

  it("should return analog fuel tank help steps and expand fuel_analog section onEnter", () => {
    const steps = RaceEditorFuelHelpHelper.getAnalogFuelTankHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(steps.length).toBeGreaterThan(0);
    steps[0].onEnter?.();
    expect(sectionsExpanded.fuel_analog).toBeTrue();
  });

  it("should combine analog fuel rate and tank steps in getAnalogFuelHelpSteps", () => {
    const rate = RaceEditorFuelHelpHelper.getAnalogFuelRateHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    const tank = RaceEditorFuelHelpHelper.getAnalogFuelTankHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    const allAnalog = RaceEditorFuelHelpHelper.getAnalogFuelHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(allAnalog.length).toBe(rate.length + tank.length);
  });

  it("should return digital fuel rate help steps and expand fuel_digital section onEnter", () => {
    const steps = RaceEditorFuelHelpHelper.getDigitalFuelRateHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(steps.length).toBeGreaterThan(0);
    steps[0].onEnter?.();
    expect(sectionsExpanded.fuel_digital).toBeTrue();
  });

  it("should return digital fuel tank help steps and expand fuel_digital section onEnter", () => {
    const steps = RaceEditorFuelHelpHelper.getDigitalFuelTankHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(steps.length).toBeGreaterThan(0);
    steps[0].onEnter?.();
    expect(sectionsExpanded.fuel_digital).toBeTrue();
  });

  it("should combine digital fuel rate and tank steps in getDigitalFuelHelpSteps", () => {
    const rate = RaceEditorFuelHelpHelper.getDigitalFuelRateHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    const tank = RaceEditorFuelHelpHelper.getDigitalFuelTankHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    const allDigital = RaceEditorFuelHelpHelper.getDigitalFuelHelpSteps(
      mockTranslationService,
      sectionsExpanded,
    );
    expect(allDigital.length).toBe(rate.length + tank.length);
  });
});
