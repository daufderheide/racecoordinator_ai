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
    expect(settings.highlightLapStyle).toBe("shimmer");
    expect(settings.highlightPracticeLapStyle).toBe("shimmer");

    // Verify new default for lapCount column
    expect(settings.columnLayouts["lapCount"]).toBeDefined();
    expect(settings.columnLayouts["lapCount"][AnchorPoint.BottomLeft]).toBe(
      "flag",
    );

    // Verify default TTS settings
    expect(settings.ttsVoice).toBe("");
    expect(settings.ttsRate).toBe(1.0);
    expect(settings.ttsPitch).toBe(1.0);
    expect(settings.ttsVolume).toBe(100);
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
      highlightLapStyle: "shimmer",
      highlightPracticeLapStyle: "glow-border",
    });
    service.saveSettings(settings);

    const retrieved = service.getSettings();
    expect(retrieved.language).toBe("es");
    expect(retrieved.selectedSeasonId).toBe("season_123");
    expect(retrieved.serverIp).toBe("1.2.3.4");
    expect(retrieved.highlightRowOnLap).toBeFalse();
    expect(retrieved.highlightPracticeRowOnLap).toBeFalse();
    expect(retrieved.highlightLapStyle).toBe("shimmer");
    expect(retrieved.highlightPracticeLapStyle).toBe("glow-border");
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

  it("should migrate legacy stored settings to classic when highlightRowOnLap is true or unset", () => {
    const legacySettings = {
      language: "en",
      highlightRowOnLap: true,
      highlightPracticeRowOnLap: true,
    };
    localStorage.setItem(
      "racecoordinator_settings",
      JSON.stringify(legacySettings),
    );

    const retrieved = service.getSettings();
    expect(retrieved.highlightLapStyle).toBe("classic");
    expect(retrieved.highlightPracticeLapStyle).toBe("classic");
  });

  it("should migrate legacy stored settings to none when highlightRowOnLap is false", () => {
    const legacySettings = {
      language: "en",
      highlightRowOnLap: false,
      highlightPracticeRowOnLap: false,
    };
    localStorage.setItem(
      "racecoordinator_settings",
      JSON.stringify(legacySettings),
    );

    const retrieved = service.getSettings();
    expect(retrieved.highlightLapStyle).toBe("none");
    expect(retrieved.highlightPracticeLapStyle).toBe("none");
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

  it("should save, retrieve and emit audio callout settings via settings$", (done) => {
    const settings = Object.assign(new Settings(), {
      urgentQueueTtl: 10000,
      calloutSpacing: 1000,
    });
    service.settings$.subscribe((emitted) => {
      if (emitted.urgentQueueTtl === 10000 && emitted.calloutSpacing === 1000) {
        expect(emitted.urgentQueueTtl).toBe(10000);
        expect(emitted.calloutSpacing).toBe(1000);
        expect(service.getSettings().urgentQueueTtl).toBe(10000);
        expect(service.getSettings().calloutSpacing).toBe(1000);
        done();
      }
    });
    service.saveSettings(settings);
  });

  it("should save, retrieve and emit TTS settings via settings$", (done) => {
    const settings = Object.assign(new Settings(), {
      ttsVoice: "Alex",
      ttsRate: 1.25,
      ttsPitch: 0.8,
      ttsVolume: 90,
    });
    service.settings$.subscribe((emitted) => {
      if (emitted.ttsVoice === "Alex") {
        expect(emitted.ttsVoice).toBe("Alex");
        expect(emitted.ttsRate).toBe(1.25);
        expect(emitted.ttsPitch).toBe(0.8);
        expect(emitted.ttsVolume).toBe(90);
        expect(service.getSettings().ttsVoice).toBe("Alex");
        expect(service.getSettings().ttsRate).toBe(1.25);
        expect(service.getSettings().ttsPitch).toBe(0.8);
        expect(service.getSettings().ttsVolume).toBe(90);
        done();
      }
    });
    service.saveSettings(settings);
  });

  it("should backfill custom template filename if base64 template exists without filename", () => {
    const legacySettings = {
      language: "en",
      customExportTemplateBase64:
        "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,ABC",
    };
    localStorage.setItem(
      "racecoordinator_settings",
      JSON.stringify(legacySettings),
    );

    const retrieved = service.getSettings();
    expect(retrieved.customExportTemplateName).toBe(
      "custom_export_template.xlsx",
    );
    expect(retrieved.customExportTemplatePath).toBe(
      "custom_export_template.xlsx",
    );
  });

  it("should preserve custom template filename and path if already present", () => {
    const settings = {
      language: "en",
      customExportTemplateBase64:
        "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,ABC",
      customExportTemplateName: "my_results.xlsx",
      customExportTemplatePath: "/docs/my_results.xlsx",
    };
    localStorage.setItem("racecoordinator_settings", JSON.stringify(settings));

    const retrieved = service.getSettings();
    expect(retrieved.customExportTemplateName).toBe("my_results.xlsx");
    expect(retrieved.customExportTemplatePath).toBe("/docs/my_results.xlsx");
  });

  describe("getSettingsSnapshot", () => {
    it("should return cached snapshot instance when localStorage has not changed", () => {
      const snap1 = service.getSettingsSnapshot();
      const snap2 = service.getSettingsSnapshot();
      expect(snap1).toBe(snap2);
    });

    it("should refresh snapshot when saveSettings is called", () => {
      const snap1 = service.getSettingsSnapshot();
      const newSettings = new Settings();
      newSettings.serverIp = "192.168.1.100";
      service.saveSettings(newSettings);

      const snap2 = service.getSettingsSnapshot();
      expect(snap2.serverIp).toBe("192.168.1.100");
      expect(snap2).not.toBe(snap1);
    });

    it("should refresh snapshot when resetToDefaults is called", () => {
      const custom = new Settings();
      custom.serverIp = "192.168.1.50";
      service.saveSettings(custom);
      expect(service.getSettingsSnapshot().serverIp).toBe("192.168.1.50");

      service.resetToDefaults();
      expect(service.getSettingsSnapshot().serverIp).toBe("");
    });

    it("should detect external localStorage changes", () => {
      const snap1 = service.getSettingsSnapshot();
      const updated = new Settings();
      updated.serverPort = 9999;
      localStorage.setItem("racecoordinator_settings", JSON.stringify(updated));

      const snap2 = service.getSettingsSnapshot();
      expect(snap2.serverPort).toBe(9999);
      expect(snap2).not.toBe(snap1);
    });
  });
});
