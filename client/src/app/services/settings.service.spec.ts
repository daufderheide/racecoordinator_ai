import { TestBed } from "@angular/core/testing";
import { Settings } from "src/app/models/settings";

import { SettingsService } from "./settings.service";

describe("SettingsService", () => {
  let service: SettingsService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [SettingsService],
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
    spyOn(console, "error");
    localStorage.setItem("racecoordinator_settings", "invalid-json");
    const settings = service.getSettings();
    expect(settings).toBeDefined();
    expect(settings.language).toBe("");
    expect(console.error).toHaveBeenCalled();
  });
});
