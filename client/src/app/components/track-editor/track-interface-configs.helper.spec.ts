import { of, throwError } from "rxjs";

import { TrackInterfaceConfigsHelper } from "./track-interface-configs.helper";

describe("TrackInterfaceConfigsHelper", () => {
  describe("factory and add/remove methods", () => {
    it("should create, add and remove ArduinoConfig", () => {
      const config = TrackInterfaceConfigsHelper.createDefaultArduinoConfig(0);
      expect(config.name).toBe("Arduino 1");
      expect(config.baudRate).toBe(115200);

      const added = TrackInterfaceConfigsHelper.addArduinoConfig([]);
      expect(added.length).toBe(1);
      expect(added[0].name).toBe("Arduino 1");

      const removed = TrackInterfaceConfigsHelper.removeArduinoConfig(added, 0);
      expect(removed.length).toBe(0);
    });

    it("should create, add and remove TrackmateConfig", () => {
      const config = TrackInterfaceConfigsHelper.createDefaultTrackmateConfig(
        1,
        4,
      );
      expect(config.name).toBe("Trackmate 2");
      expect(config.numLanes).toBe(4);

      const added = TrackInterfaceConfigsHelper.addTrackmateConfig([], 2);
      expect(added.length).toBe(1);
      expect(added[0].numLanes).toBe(2);

      const removed = TrackInterfaceConfigsHelper.removeTrackmateConfig(
        added,
        0,
      );
      expect(removed.length).toBe(0);
    });

    it("should create, add and remove BartConfig", () => {
      const config = TrackInterfaceConfigsHelper.createDefaultBartConfig(0, 2);
      expect(config.name).toBe("BART 1");
      expect(config.minLapMs).toBe(1);

      const added = TrackInterfaceConfigsHelper.addBartConfig([], 3);
      expect(added.length).toBe(1);
      expect(added[0].numLanes).toBe(3);

      const removed = TrackInterfaceConfigsHelper.removeBartConfig(added, 0);
      expect(removed.length).toBe(0);
    });

    it("should create, add and remove PhidgetConfig", () => {
      const config = TrackInterfaceConfigsHelper.createDefaultPhidgetConfig(2);
      expect(config.name).toBe("Phidget 3");
      expect(config.digitalInIds.length).toBe(32);

      const added = TrackInterfaceConfigsHelper.addPhidgetConfig([]);
      expect(added.length).toBe(1);

      const removed = TrackInterfaceConfigsHelper.removePhidgetConfig(added, 0);
      expect(removed.length).toBe(0);
    });
  });

  describe("buildInterfaceTabs", () => {
    it("should build tab list for all configured interfaces", () => {
      const tabs = TrackInterfaceConfigsHelper.buildInterfaceTabs(
        [{ name: "A1" } as any],
        [{ name: "TM1" } as any],
        [{ name: "P1" } as any],
        [{ name: "B1" } as any],
      );

      expect(tabs.length).toBe(4);
      expect(tabs[0]).toEqual({
        id: "interface-arduino-0",
        label: "Arduino 1",
      });
      expect(tabs[1]).toEqual({
        id: "interface-trackmate-0",
        label: "Trakmate 1",
      });
      expect(tabs[2]).toEqual({
        id: "interface-phidget-0",
        label: "Phidget 1",
      });
      expect(tabs[3]).toEqual({
        id: "interface-bart-0",
        label: "BART 1",
      });
    });

    it("should return empty list when no configs provided", () => {
      expect(
        TrackInterfaceConfigsHelper.buildInterfaceTabs(
          undefined,
          undefined,
          undefined,
          undefined,
        ),
      ).toEqual([]);
    });
  });

  describe("scrollToAndExpandInterface", () => {
    it("should ignore invalid tab IDs", () => {
      expect(() =>
        TrackInterfaceConfigsHelper.scrollToAndExpandInterface(
          "invalid-tab",
          {},
        ),
      ).not.toThrow();
    });

    it("should expand correct editor on match", () => {
      const mockArduino = { ensureSectionsExpanded: jasmine.createSpy() };
      const editors = {
        arduinoEditors: {
          get: (index: number) => (index === 0 ? mockArduino : undefined),
        } as any,
      };

      const cdr = { detectChanges: jasmine.createSpy() };

      TrackInterfaceConfigsHelper.scrollToAndExpandInterface(
        "interface-arduino-0",
        editors,
        cdr as any,
      );

      expect(mockArduino.ensureSectionsExpanded).toHaveBeenCalled();
      expect(cdr.detectChanges).toHaveBeenCalled();
    });
  });

  describe("initializeInterfaces", () => {
    let mockDataService: any;
    let mockLogger: any;

    beforeEach(() => {
      mockDataService = {
        initializeInterface: jasmine
          .createSpy("initializeInterface")
          .and.returnValue(of({ success: true })),
        closeInterface: jasmine
          .createSpy("closeInterface")
          .and.returnValue(of({})),
      };
      mockLogger = {
        info: jasmine.createSpy("info"),
        warn: jasmine.createSpy("warn"),
        error: jasmine.createSpy("error"),
        debug: jasmine.createSpy("debug"),
      };
    });

    it("should call initializeInterface when any interface config exists", () => {
      TrackInterfaceConfigsHelper.initializeInterfaces(
        mockDataService,
        mockLogger,
        {
          arduinoConfigs: [{ name: "A1" } as any],
          trackmateConfigs: [],
          phidgetConfigs: [],
          bartConfigs: [],
          numLanes: 2,
        },
      );
      expect(mockDataService.initializeInterface).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalled();
    });

    it("should warn if initializeInterface returns unsuccessful", () => {
      mockDataService.initializeInterface.and.returnValue(
        of({ success: false, message: "Port busy" }),
      );
      TrackInterfaceConfigsHelper.initializeInterfaces(
        mockDataService,
        mockLogger,
        {
          arduinoConfigs: [{ name: "A1" } as any],
          trackmateConfigs: [],
          phidgetConfigs: [],
          bartConfigs: [],
          numLanes: 2,
        },
      );
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it("should error if initializeInterface throws", () => {
      mockDataService.initializeInterface.and.returnValue(
        throwError(() => new Error("Network error")),
      );
      TrackInterfaceConfigsHelper.initializeInterfaces(
        mockDataService,
        mockLogger,
        {
          arduinoConfigs: [{ name: "A1" } as any],
          trackmateConfigs: [],
          phidgetConfigs: [],
          bartConfigs: [],
          numLanes: 2,
        },
      );
      expect(mockLogger.error).toHaveBeenCalled();
    });

    it("should call closeInterface when no configs exist", () => {
      TrackInterfaceConfigsHelper.initializeInterfaces(
        mockDataService,
        mockLogger,
        {
          arduinoConfigs: [],
          trackmateConfigs: [],
          phidgetConfigs: [],
          bartConfigs: [],
          numLanes: 2,
        },
      );
      expect(mockDataService.closeInterface).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalled();
    });
  });
});
