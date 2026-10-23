import {
  loadArduinoGroupsCollapsed,
  loadArduinoLedStringsExpanded,
  loadArduinoLedStringsLinked,
  loadArduinoSections,
  loadArduinoVoltageLinked,
  saveArduinoState,
} from "./arduino-storage.helper";

describe("arduino-storage.helper", () => {
  const mockLogger = { error: jasmine.createSpy("error") } as any;
  const defaultSections = {
    arduino: true,
    main: true,
    digital: false,
    analog: false,
    voltage: false,
    leds: false,
  };

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("saves and loads arduino sections", () => {
    const sections = {
      arduino: false,
      main: true,
      digital: true,
      analog: false,
      voltage: true,
      leds: true,
    };
    saveArduinoState(0, sections, [true], { g1: false });

    const loaded = loadArduinoSections(0, defaultSections, mockLogger);
    expect(loaded.arduino).toBe(false);
    expect(loaded.analog).toBe(false);
    expect(loaded.digital).toBe(true);
  });

  it("loads default sections when local storage is empty", () => {
    const loaded = loadArduinoSections(1, defaultSections, mockLogger);
    expect(loaded.arduino).toBe(true);
    expect(loaded.main).toBe(true);
    expect(loaded.digital).toBe(false);
  });

  it("loads LED strings expanded states with proper length padding", () => {
    localStorage.setItem(
      "rc.arduino-editor.led-strings.0",
      JSON.stringify([false]),
    );
    const expanded = loadArduinoLedStringsExpanded(0, 3, mockLogger);
    expect(expanded.length).toBe(3);
    expect(expanded[0]).toBe(false);
    expect(expanded[1]).toBe(true);
    expect(expanded[2]).toBe(true);
  });

  it("loads and saves groups collapsed map", () => {
    saveArduinoState(0, {} as any, [], { "lap-group": false });
    const groups = loadArduinoGroupsCollapsed(0, mockLogger);
    expect(groups["lap-group"]).toBe(false);
  });

  it("loads voltage linked and led strings linked flags", () => {
    expect(loadArduinoVoltageLinked(0)).toBe(false);
    expect(loadArduinoLedStringsLinked(0)).toBe(true);

    localStorage.setItem("rc.arduino-editor.voltage-linked.0", "true");
    localStorage.setItem("rc.arduino-editor.led-strings-linked.0", "false");

    expect(loadArduinoVoltageLinked(0)).toBe(true);
    expect(loadArduinoLedStringsLinked(0)).toBe(false);
  });
});
