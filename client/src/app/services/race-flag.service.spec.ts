import { TestBed } from "@angular/core/testing";
import { BehaviorSubject, of, Subject } from "rxjs";
import { DataService } from "@app/data.service";
import { RaceFlag, RaceState } from "@app/proto/antigravity";

import { RaceService } from "./race.service";
import { RaceConnectionService } from "./race-connection.service";
import { RaceFlagService } from "./race-flag.service";
import { SettingsService } from "./settings.service";
import { ThemeService } from "./theme.service";

describe("RaceFlagService", () => {
  let service: RaceFlagService;
  let raceFlagSubject: BehaviorSubject<RaceFlag>;
  let raceStateSubject: BehaviorSubject<RaceState>;
  let currentHeatSubject: BehaviorSubject<any>;

  beforeEach(() => {
    raceFlagSubject = new BehaviorSubject<RaceFlag>(RaceFlag.RED);
    raceStateSubject = new BehaviorSubject<RaceState>(RaceState.NOT_STARTED);
    currentHeatSubject = new BehaviorSubject<any>(null);

    const raceConnectionSpy = jasmine.createSpyObj(
      "RaceConnectionService",
      [],
      {
        raceFlag$: raceFlagSubject.asObservable(),
        raceState$: raceStateSubject.asObservable(),
      },
    );

    const raceServiceSpy = jasmine.createSpyObj("RaceService", [], {
      currentHeat$: currentHeatSubject.asObservable(),
    });

    const themeServiceSpy = jasmine.createSpyObj("ThemeService", [
      "resolveAssetId",
    ]);
    const settingsServiceSpy = jasmine.createSpyObj("SettingsService", [
      "getSettings",
    ]);
    const dataServiceSpy = jasmine.createSpyObj("DataService", ["listAssets"], {
      serverUrl: "http://localhost:7070",
    });
    dataServiceSpy.listAssets.and.returnValue(of([]));
    dataServiceSpy.socketConnected$ = of(true);

    TestBed.configureTestingModule({
      providers: [
        RaceFlagService,
        { provide: RaceConnectionService, useValue: raceConnectionSpy },
        { provide: RaceService, useValue: raceServiceSpy },
        { provide: ThemeService, useValue: themeServiceSpy },
        { provide: SettingsService, useValue: settingsServiceSpy },
        { provide: DataService, useValue: dataServiceSpy },
      ],
    });
    service = TestBed.inject(RaceFlagService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should return flag.not_started and red color initially", () => {
    expect(service.getFlagType()).toBe("flag.not_started");
    expect(service.getFlagColor()).toBe("red");
  });

  it("should update behavioral flag type and color when RaceConnectionService emits", () => {
    raceStateSubject.next(RaceState.RACING);
    raceFlagSubject.next(RaceFlag.GREEN);
    expect(service.getFlagType()).toBe("flag.racing");
    expect(service.getFlagColor()).toBe("green");

    raceStateSubject.next(RaceState.PAUSED);
    raceFlagSubject.next(RaceFlag.YELLOW);
    expect(service.getFlagType()).toBe("flag.heat_paused");
    expect(service.getFlagColor()).toBe("yellow");

    raceStateSubject.next(RaceState.RACING);
    raceFlagSubject.next(RaceFlag.WHITE);
    expect(service.getFlagType()).toBe("flag.one_lap_to_go");
    expect(service.getFlagColor()).toBe("white");

    raceStateSubject.next(RaceState.RACING);
    raceFlagSubject.next(RaceFlag.CHECKERED);
    expect(service.getFlagType()).toBe("flag.heat_finishing");
    expect(service.getFlagColor()).toBe("checkered");

    raceStateSubject.next(RaceState.RACE_OVER);
    raceFlagSubject.next(RaceFlag.CHECKERED);
    expect(service.getFlagType()).toBe("flag.race_over");
    expect(service.getFlagColor()).toBe("checkered");

    raceFlagSubject.next(RaceFlag.GREEN_YELLOW);
    expect(service.getFlagType()).toBe("flag.warmup");
    expect(service.getFlagColor()).toBe("green");

    raceFlagSubject.next(RaceFlag.BLACK);
    expect(service.getFlagType()).toBe("flag.penalty");
    expect(service.getFlagColor()).toBe("black");
  });

  it("should distinguish initial start from restart countdown", () => {
    raceStateSubject.next(RaceState.STARTING);
    raceFlagSubject.next(RaceFlag.RED);
    currentHeatSubject.next({ started: false, heatDrivers: [] });
    expect(service.getFlagType()).toBe("flag.starting");

    currentHeatSubject.next({ started: true, heatDrivers: [] });
    expect(service.getFlagType()).toBe("flag.restarting");
  });

  it("should return translatable flag names", () => {
    raceStateSubject.next(RaceState.NOT_STARTED);
    raceFlagSubject.next(RaceFlag.RED);
    expect(service.getFlagNameKey()).toBe("UE_LABEL_FLAG_NOT_STARTED");

    raceStateSubject.next(RaceState.RACING);
    raceFlagSubject.next(RaceFlag.GREEN);
    expect(service.getFlagNameKey()).toBe("UE_LABEL_FLAG_RACING");
  });

  describe("getFlagUrl", () => {
    let themeService: jasmine.SpyObj<any>;
    let settingsService: jasmine.SpyObj<any>;

    beforeEach(() => {
      themeService = TestBed.inject(ThemeService) as any;
      settingsService = TestBed.inject(SettingsService) as any;

      settingsService.getSettings.and.returnValue({
        serverIp: "localhost",
        serverPort: 7070,
      });
    });

    it("should resolve via theme slot if available", () => {
      themeService.resolveAssetId.and.returnValue("asset-green-id");
      (service as any).assets = [
        { entity_id: "asset-green-id", url: "/assets/green.png" },
      ];

      raceStateSubject.next(RaceState.RACING);
      const url = service.getFlagUrl(RaceFlag.GREEN);
      expect(url).toBe("http://localhost:7070/assets/green.png");
      expect(themeService.resolveAssetId).toHaveBeenCalledWith("flag.racing");
    });

    it("should use dataService.serverUrl to resolve asset URLs (mobile bug fix)", () => {
      const dataService = TestBed.inject(DataService) as any;
      const originalServerUrl = dataService.serverUrl;
      Object.defineProperty(dataService, "serverUrl", {
        get: () => "http://192.168.1.100:7070",
        configurable: true,
      });

      themeService.resolveAssetId.and.returnValue("asset-green-id");
      (service as any).assets = [
        { entity_id: "asset-green-id", url: "/assets/green.png" },
      ];

      settingsService.getSettings.and.returnValue({
        serverIp: "localhost",
        serverPort: 7070,
      });

      raceStateSubject.next(RaceState.RACING);
      const url = service.getFlagUrl(RaceFlag.GREEN);
      expect(url).toBe("http://192.168.1.100:7070/assets/green.png");

      Object.defineProperty(dataService, "serverUrl", {
        get: () => originalServerUrl,
        configurable: true,
      });
    });

    it("should resolve via settings if theme slot not found", () => {
      themeService.resolveAssetId.and.returnValue(null);
      settingsService.getSettings.and.returnValue({
        serverIp: "localhost",
        serverPort: 7070,
        flagRacing: "http://custom/green.png",
      });

      raceStateSubject.next(RaceState.RACING);
      const url = service.getFlagUrl(RaceFlag.GREEN);
      expect(url).toBe("http://custom/green.png");
    });

    it("should fallback to an empty string if neither theme nor settings provide a URL", () => {
      themeService.resolveAssetId.and.returnValue(null);
      settingsService.getSettings.and.returnValue({
        serverIp: "localhost",
        serverPort: 7070,
      });

      raceStateSubject.next(RaceState.RACING);
      const url = service.getFlagUrl(RaceFlag.GREEN);
      expect(url).toBe("");
    });
  });

  describe("Connection recovery", () => {
    it("should reload assets when socketConnected$ emits true", () => {
      const socketSubject = new Subject<boolean>();
      const assetsSubject = new Subject<any[]>();

      const customDataServiceSpy = jasmine.createSpyObj(
        "DataService",
        ["listAssets"],
        { serverUrl: "http://localhost:7070" },
      );
      customDataServiceSpy.socketConnected$ = socketSubject.asObservable();
      customDataServiceSpy.listAssets.and.returnValue(
        assetsSubject.asObservable(),
      );

      const customRaceConnectionSpy = jasmine.createSpyObj(
        "RaceConnectionService",
        [],
        {
          raceFlag$: of(RaceFlag.RED),
          raceState$: of(RaceState.RACING),
        },
      );
      const customRaceServiceSpy = jasmine.createSpyObj("RaceService", [], {
        currentHeat$: of(null),
      });
      const customThemeServiceSpy = jasmine.createSpyObj("ThemeService", [
        "resolveAssetId",
      ]);
      const customSettingsServiceSpy = jasmine.createSpyObj("SettingsService", [
        "getSettings",
      ]);
      customSettingsServiceSpy.getSettings.and.returnValue({
        serverIp: "localhost",
        serverPort: 7070,
      });

      const customService = new RaceFlagService(
        customRaceConnectionSpy as any,
        customRaceServiceSpy as any,
        customThemeServiceSpy as any,
        customSettingsServiceSpy as any,
        customDataServiceSpy as any,
      );

      expect(customDataServiceSpy.listAssets).not.toHaveBeenCalled();

      socketSubject.next(true);

      expect(customDataServiceSpy.listAssets).toHaveBeenCalled();

      const mockAssets = [
        { entity_id: "asset-green-id", url: "/assets/green.png" },
      ];
      assetsSubject.next(mockAssets);

      customThemeServiceSpy.resolveAssetId.and.returnValue("asset-green-id");
      expect(customService.getFlagUrl(RaceFlag.GREEN)).toContain("green.png");
    });
  });
});
