import { TestBed } from "@angular/core/testing";
import { BehaviorSubject, of, Subject } from "rxjs";
import { DataService } from "@app/data.service";
import { RaceFlag } from "@app/proto/antigravity";

import { RaceConnectionService } from "./race-connection.service";
import { RaceFlagService } from "./race-flag.service";
import { SettingsService } from "./settings.service";
import { ThemeService } from "./theme.service";

describe("RaceFlagService", () => {
  let service: RaceFlagService;
  let raceFlagSubject: BehaviorSubject<RaceFlag>;

  beforeEach(() => {
    raceFlagSubject = new BehaviorSubject<RaceFlag>(RaceFlag.RED);

    const raceConnectionSpy = jasmine.createSpyObj(
      "RaceConnectionService",
      [],
      {
        raceFlag$: raceFlagSubject.asObservable(),
      },
    );

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

  it("should return RED flag type and color initially", () => {
    expect(service.getFlagType()).toBe("red");
    expect(service.getFlagColor()).toBe("red");
  });

  it("should update flag type and color when RaceConnectionService emits", () => {
    raceFlagSubject.next(RaceFlag.GREEN);
    expect(service.getFlagType()).toBe("green");
    expect(service.getFlagColor()).toBe("green");

    raceFlagSubject.next(RaceFlag.YELLOW);
    expect(service.getFlagType()).toBe("yellow");
    expect(service.getFlagColor()).toBe("yellow");

    raceFlagSubject.next(RaceFlag.WHITE);
    expect(service.getFlagType()).toBe("white");
    expect(service.getFlagColor()).toBe("white");

    raceFlagSubject.next(RaceFlag.CHECKERED);
    expect(service.getFlagType()).toBe("checkered");
    expect(service.getFlagColor()).toBe("checkered");

    raceFlagSubject.next(RaceFlag.GREEN_YELLOW);
    expect(service.getFlagType()).toBe("green_yellow");
    expect(service.getFlagColor()).toBe("green");
  });

  it("should return translatable flag names", () => {
    raceFlagSubject.next(RaceFlag.RED);
    expect(service.getFlagNameKey()).toBe("RACE_FLAG_RED");

    raceFlagSubject.next(RaceFlag.GREEN);
    expect(service.getFlagNameKey()).toBe("RACE_FLAG_GREEN");
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

      const url = service.getFlagUrl(RaceFlag.GREEN);
      expect(url).toBe("http://localhost:7070/assets/green.png");
      expect(themeService.resolveAssetId).toHaveBeenCalledWith("flag.green");
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

      // Even if settings says localhost (which caused the bug), the dataService url should take precedence
      settingsService.getSettings.and.returnValue({
        serverIp: "localhost",
        serverPort: 7070,
      });

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
        flagGreen: "http://custom/green.png",
      });

      const url = service.getFlagUrl(RaceFlag.GREEN);
      expect(url).toBe("http://custom/green.png");
    });

    it("should fallback to default assets if neither theme nor settings provide a URL", () => {
      themeService.resolveAssetId.and.returnValue(null);
      settingsService.getSettings.and.returnValue({
        serverIp: "localhost",
        serverPort: 7070,
      });

      const url = service.getFlagUrl(RaceFlag.GREEN);
      expect(url).toBe("/assets/images/flags/green.png");
    });

    it("should handle black flag fallback with svg extension", () => {
      themeService.resolveAssetId.and.returnValue(null);
      settingsService.getSettings.and.returnValue({});

      const url = service.getFlagUrl(RaceFlag.BLACK);
      expect(url).toBe("/assets/images/flags/black.svg");
    });

    it("should map green_yellow to yellow_green asset filename", () => {
      themeService.resolveAssetId.and.returnValue(null);
      settingsService.getSettings.and.returnValue({});

      const url = service.getFlagUrl(RaceFlag.GREEN_YELLOW);
      expect(url).toBe("/assets/images/flags/yellow_green.png");
    });

    it("should default to red flag for unknown string types", () => {
      themeService.resolveAssetId.and.returnValue(null);
      settingsService.getSettings.and.returnValue({});

      const url = service.getFlagUrl("unknown-type" as any);
      expect(url).toBe("/assets/images/flags/red.png");
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
        },
      );
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
