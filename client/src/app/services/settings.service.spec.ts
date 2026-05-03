import { TestBed } from "@angular/core/testing";
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
  });

  it("should save and retrieve language setting", () => {
    const settings = Object.assign(new Settings(), {
      recentRaceIds: ["r1"],
      selectedDriverIds: ["d1"],
      serverIp: "1.2.3.4",
      serverPort: 8080,
      language: "es",
      highlightRowOnLap: false,
    });
    service.saveSettings(settings);

    const retrieved = service.getSettings();
    expect(retrieved.language).toBe("es");
    expect(retrieved.serverIp).toBe("1.2.3.4");
    expect(retrieved.highlightRowOnLap).toBeFalse();
  });

  it("should handle corrupt JSON in localStorage", () => {
    localStorage.setItem("racecoordinator_settings", "invalid-json");
    const settings = service.getSettings();
    expect(settings).toBeDefined();
    expect(settings.language).toBe("");
    expect(mockLogger.error).toHaveBeenCalled();
  });
});
