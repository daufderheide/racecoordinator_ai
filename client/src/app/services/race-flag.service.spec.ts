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

    it("should resolve via settings for all behavioral flag keys when theme slot is null", () => {
      themeService.resolveAssetId.and.returnValue(null);
      settingsService.getSettings.and.returnValue({
        serverIp: "localhost",
        serverPort: 7070,
        flagRacing: "/racing.png",
        flagHeatPaused: "/paused.png",
        flagHeatOver: "/heat_over.png",
        flagRaceOver: "/race_over.png",
        flagNotStarted: "/not_started.png",
        flagStarting: "/starting.png",
        flagRestarting: "/restarting.png",
        flagOneLapToGo: "/one_lap.png",
        flagHeatFinishing: "/finishing.png",
        flagWarmup: "/warmup.png",
        flagDriverFinished: "/driver_finished.png",
        flagPenalty: "/penalty.png",
      });

      expect(service.getFlagUrl("flag.racing")).toBe(
        "http://localhost:7070/racing.png",
      );
      expect(service.getFlagUrl("flag.heat_paused")).toBe(
        "http://localhost:7070/paused.png",
      );
      expect(service.getFlagUrl("flag.heat_over")).toBe(
        "http://localhost:7070/heat_over.png",
      );
      expect(service.getFlagUrl("flag.race_over")).toBe(
        "http://localhost:7070/race_over.png",
      );
      expect(service.getFlagUrl("flag.not_started")).toBe(
        "http://localhost:7070/not_started.png",
      );
      expect(service.getFlagUrl("flag.starting")).toBe(
        "http://localhost:7070/starting.png",
      );
      expect(service.getFlagUrl("flag.restarting")).toBe(
        "http://localhost:7070/restarting.png",
      );
      expect(service.getFlagUrl("flag.one_lap_to_go")).toBe(
        "http://localhost:7070/one_lap.png",
      );
      expect(service.getFlagUrl("flag.heat_finishing")).toBe(
        "http://localhost:7070/finishing.png",
      );
      expect(service.getFlagUrl("flag.warmup")).toBe(
        "http://localhost:7070/warmup.png",
      );
      expect(service.getFlagUrl("flag.driver_finished")).toBe(
        "http://localhost:7070/driver_finished.png",
      );
      expect(service.getFlagUrl("flag.penalty")).toBe(
        "http://localhost:7070/penalty.png",
      );
    });

    it("should handle asset matching by model.entityId, _id, or dataService.getAssetUrl", () => {
      themeService.resolveAssetId.and.returnValue("asset-custom");
      const dataService = TestBed.inject(DataService) as any;
      dataService.getAssetUrl = jasmine
        .createSpy("getAssetUrl")
        .and.returnValue("https://cdn.example.com/asset.png");

      // Match by model.entityId
      (service as any).assets = [
        { model: { entityId: "asset-custom" }, url: "assets/custom1.png" },
      ];
      expect(service.getFlagUrl("flag.racing")).toBe(
        "http://localhost:7070/assets/custom1.png",
      );

      // Match by _id
      (service as any).assets = [
        { _id: "asset-custom", url: "https://external.com/custom2.png" },
      ];
      expect(service.getFlagUrl("flag.racing")).toBe(
        "https://external.com/custom2.png",
      );

      // Fallback to dataService.getAssetUrl
      (service as any).assets = [];
      expect(service.getFlagUrl("flag.racing")).toBe(
        "https://cdn.example.com/asset.png",
      );
    });

    it("should fallback to unknown state switch cases when state is UNKNOWN_STATE", () => {
      raceStateSubject.next(RaceState.UNKNOWN_STATE);

      expect(service.getBehavioralFlagKey(RaceFlag.GREEN)).toBe("flag.racing");
      expect(service.getBehavioralFlagKey(RaceFlag.YELLOW)).toBe(
        "flag.heat_paused",
      );
      expect(service.getBehavioralFlagKey(RaceFlag.RED)).toBe(
        "flag.not_started",
      );
      expect(service.getBehavioralFlagKey(RaceFlag.CHECKERED)).toBe(
        "flag.heat_finishing",
      );
      expect(service.getBehavioralFlagKey(RaceFlag.UNKNOWN_FLAG)).toBe(
        "flag.not_started",
      );
    });

    it("should test getFlagTypeForFlag and getFlagColor branches", () => {
      expect(service.getFlagTypeForFlag(RaceFlag.GREEN)).toBe("green");
      expect(service.getFlagTypeForFlag(RaceFlag.YELLOW)).toBe("yellow");
      expect(service.getFlagTypeForFlag(RaceFlag.RED)).toBe("red");
      expect(service.getFlagTypeForFlag(RaceFlag.WHITE)).toBe("white");
      expect(service.getFlagTypeForFlag(RaceFlag.CHECKERED)).toBe("checkered");
      expect(service.getFlagTypeForFlag(RaceFlag.BLACK)).toBe("black");
      expect(service.getFlagTypeForFlag(RaceFlag.GREEN_YELLOW)).toBe("green");
      expect(service.getFlagTypeForFlag(RaceFlag.UNKNOWN_FLAG)).toBe("red");
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

  describe("getCurrentFlagUrl and currentFlagUrl$", () => {
    it("should return the behavioral flag url via getCurrentFlagUrl", () => {
      spyOn(service, "getFlagUrl").and.returnValue(
        "http://localhost:7070/assets/flag.png",
      );
      expect(service.getCurrentFlagUrl()).toBe(
        "http://localhost:7070/assets/flag.png",
      );
      expect(service.getFlagUrl).toHaveBeenCalledWith(service.getFlagType());
    });

    it("should emit on currentFlagUrl$ when race flag or race state changes", (done) => {
      spyOn(service, "getFlagUrl").and.returnValue(
        "http://localhost:7070/assets/green.png",
      );

      service.currentFlagUrl$.subscribe((url) => {
        if (url === "http://localhost:7070/assets/green.png") {
          expect(url).toBe("http://localhost:7070/assets/green.png");
          done();
        }
      });

      raceFlagSubject.next(RaceFlag.GREEN);
    });
  });
});
