import { TestBed } from "@angular/core/testing";
import { AnchorPoint } from "@app/components/raceday/column_definition";
import { Settings } from "@app/models/settings";
import { LoggerService } from "@app/services/logger.service";

import { SettingsService } from "./settings.service";

describe("SettingsService", () => {
  let service: SettingsService;
  let mockLogger: any;

  beforeEach(() => {
    localStorage.clear();
    mockLogger = {
      error: jasmine.createSpy("error"),
      info: jasmine.createSpy("info"),
      debug: jasmine.createSpy("debug"),
      warn: jasmine.createSpy("warn"),
    };
    TestBed.configureTestingModule({
      providers: [
        SettingsService,
        { provide: LoggerService, useValue: mockLogger },
      ],
    });
    service = TestBed.inject(SettingsService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return default settings when nothing is stored", () => {
    const settings = service.getSettings();
    expect(settings.language).toBe("");
    expect(settings.serverIp).toBe("");
    expect(settings.highlightRowOnLap).toBeTrue();
    expect(settings.highlightPracticeRowOnLap).toBeTrue();

    // Verify new default for lapCount column
    expect(settings.columnLayouts["lapCount"]).toBeDefined();
    expect(settings.columnLayouts["lapCount"][AnchorPoint.BottomLeft]).toBe(
      "flag",
    );
  });

  it("should save and retrieve language and selectedSeasonId settings", () => {
    const settings = Object.assign(new Settings(), {
      recentRaceIds: ["r1"],
      selectedDriverIds: ["d1"],
      selectedSeasonId: "season_123",
      serverIp: "1.2.3.4",
      serverPort: 8080,
      language: "es",
      highlightRowOnLap: false,
      highlightPracticeRowOnLap: false,
    });
    service.saveSettings(settings);

    const retrieved = service.getSettings();
    expect(retrieved.language).toBe("es");
    expect(retrieved.selectedSeasonId).toBe("season_123");
    expect(retrieved.serverIp).toBe("1.2.3.4");
    expect(retrieved.highlightRowOnLap).toBeFalse();
    expect(retrieved.highlightPracticeRowOnLap).toBeFalse();
  });

  it("should backfill driver state to lapCount column if missing in stored settings", () => {
    const legacySettings = {
      language: "en",
      columnLayouts: {
        lapCount: {
          [AnchorPoint.CenterCenter]: "lapCount",
        },
      },
    };
    localStorage.setItem(
      "racecoordinator_settings",
      JSON.stringify(legacySettings),
    );

    const retrieved = service.getSettings();
    expect(retrieved.columnLayouts["lapCount"][AnchorPoint.BottomLeft]).toBe(
      "flag",
    );
    expect(retrieved.driverStateBackfilled).toBeTrue();
  });

  it("should NOT backfill driver state if bottom-left anchor is already set", () => {
    const customSettings = {
      language: "en",
      driverStateBackfilled: false,
      columnLayouts: {
        lapCount: {
          [AnchorPoint.CenterCenter]: "lapCount",
          [AnchorPoint.BottomLeft]: "some_other_property",
        },
      },
    };
    localStorage.setItem(
      "racecoordinator_settings",
      JSON.stringify(customSettings),
    );

    const retrieved = service.getSettings();
    expect(retrieved.columnLayouts["lapCount"][AnchorPoint.BottomLeft]).toBe(
      "some_other_property",
    );
    expect(retrieved.driverStateBackfilled).toBeTrue();
  });

  it("should NOT backfill if driverStateBackfilled is true even if anchor is empty", () => {
    const customSettings = {
      language: "en",
      driverStateBackfilled: true,
      columnLayouts: {
        lapCount: {
          [AnchorPoint.CenterCenter]: "lapCount",
        },
      },
    };
    localStorage.setItem(
      "racecoordinator_settings",
      JSON.stringify(customSettings),
    );

    const retrieved = service.getSettings();
    expect(
      retrieved.columnLayouts["lapCount"][AnchorPoint.BottomLeft],
    ).toBeUndefined();
    expect(retrieved.driverStateBackfilled).toBeTrue();
  });

  it("should handle corrupt JSON in localStorage", () => {
    localStorage.setItem("racecoordinator_settings", "invalid-json");
    const settings = service.getSettings();
    expect(settings).toBeDefined();
    expect(settings.language).toBe("");
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it("should save, retrieve and emit pageTransition setting via settings$", (done) => {
    const settings = Object.assign(new Settings(), {
      pageTransition: "fade",
    });
    service.settings$.subscribe((emitted) => {
      if (emitted.pageTransition === "fade") {
        expect(emitted.pageTransition).toBe("fade");
        expect(service.getSettings().pageTransition).toBe("fade");
        done();
      }
    });
    service.saveSettings(settings);
  });
});
