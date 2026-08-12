import { CommonModule } from "@angular/common";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { DataService } from "@app/data.service";
import { Season } from "@app/models/season";
import { LoggerService } from "@app/services/logger.service";
import { PrintService } from "@app/services/print.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";

import { DefaultSeasonResultsComponent } from "./default-season-results.component";

describe("DefaultSeasonResultsComponent", () => {
  let component: DefaultSeasonResultsComponent;
  let fixture: ComponentFixture<DefaultSeasonResultsComponent>;

  const mockSeason: Season = {
    entity_id: "season_1",
    name: "2026 Championship",
    drops: 1,
    races: [
      {
        race_id: "r1",
        race_name: "Race 1",
        timestamp: 1000,
        is_demo: false,
        driver_results: [
          {
            driver_id: "d1",
            driver_name: "Driver One",
            overall_rank: 1,
            overall_points: 25,
            heat_points: 5,
            total_points: 30,
          },
          {
            driver_id: "d2",
            driver_name: "Driver Two",
            overall_rank: 2,
            overall_points: 18,
            heat_points: 2,
            total_points: 20,
          },
        ],
      },
    ],
  };

  const mockDataService = {
    getSeasons: () => of([mockSeason]),
  };

  const selectedRaceSubject = new BehaviorSubject<any>(null);
  const heatsSubject = new BehaviorSubject<any[]>([]);

  const mockRaceService = {
    selectedRace$: selectedRaceSubject.asObservable(),
    heats$: heatsSubject.asObservable(),
    getRace: () => null,
  };

  const mockRaceConnectionService = {
    connect: jasmine.createSpy("connect"),
    disconnect: jasmine.createSpy("disconnect"),
  };

  const mockSettingsService = {
    getSettings: () => ({
      selectedSeasonId: "season_1",
      exportPdfBackgrounds: true,
    }),
    saveSettings: jasmine.createSpy("saveSettings"),
  };

  const mockPrintService = {
    print: jasmine.createSpy("print"),
  };

  const mockTranslationService = {
    translate: (key: string) => key,
  };

  const mockLoggerService = {
    error: jasmine.createSpy("error"),
    debug: jasmine.createSpy("debug"),
  };

  const mockActivatedRoute = {
    queryParamMap: of(new Map([["id", "season_1"]])),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultSeasonResultsComponent, CommonModule],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: PrintService, useValue: mockPrintService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DefaultSeasonResultsComponent);
    component = fixture.componentInstance;
  });

  it("should create component and load season data", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.season).not.toBeNull();
    expect(component.season?.name).toBe("2026 Championship");
    expect(component.standings.length).toBe(2);
    expect(component.standings[0].driver_name).toBe("Driver One");
    expect(component.standings[0].net_points).toBe(30);
  });

  it("should toggle race expansion", () => {
    fixture.detectChanges();
    expect(component.isRaceExpanded("r1")).toBeFalse();
    component.toggleRaceExpanded("r1");
    expect(component.isRaceExpanded("r1")).toBeTrue();
    component.toggleRaceExpanded("r1");
    expect(component.isRaceExpanded("r1")).toBeFalse();
  });

  it("should calculate drop races correctly when races run exceed drops", () => {
    component.season = {
      name: "Drop Test Season",
      drops: 1,
      races: [
        {
          race_id: "r1",
          race_name: "Race 1",
          timestamp: 1000,
          driver_results: [
            {
              driver_id: "d1",
              driver_name: "D1",
              overall_rank: 1,
              overall_points: 10,
              heat_points: 0,
              total_points: 10,
            },
          ],
        },
        {
          race_id: "r2",
          race_name: "Race 2",
          timestamp: 2000,
          driver_results: [
            {
              driver_id: "d1",
              driver_name: "D1",
              overall_rank: 1,
              overall_points: 25,
              heat_points: 0,
              total_points: 25,
            },
          ],
        },
      ],
    };
    component.calculateStandings();
    expect(component.standings.length).toBe(1);
    // Total is 35 (10 + 25), with 1 drop (drops lowest 10), net points should be 25
    expect(component.standings[0].gross_points).toBe(35);
    expect(component.standings[0].net_points).toBe(25);
  });

  it("should detect demo races via hasDemoRaces getter", () => {
    component.season = {
      name: "Demo Season",
      drops: 0,
      races: [
        {
          race_id: "r1",
          race_name: "R1",
          timestamp: 1000,
          is_demo: true,
          driver_results: [],
        },
      ],
    };
    expect(component.hasDemoRaces).toBeTrue();

    component.season = {
      name: "Pro Season",
      drops: 0,
      races: [
        {
          race_id: "r1",
          race_name: "R1",
          timestamp: 1000,
          is_demo: false,
          driver_results: [],
        },
      ],
    };
    expect(component.hasDemoRaces).toBeFalse();
  });

  it("should open PDF export dialog on exportPdf()", () => {
    component.exportPdf();
    expect(component.showPdfExportDialog).toBeTrue();
    expect(component.defaultIncludeBackground).toBeTrue();
  });

  it("should handle PDF export confirmation and invoke PrintService", () => {
    component.season = { name: "2026 Championship", drops: 0, races: [] };
    component.onPdfExportConfirm({
      includeBackground: false,
      saveAsDefault: true,
    });

    expect(component.showPdfExportDialog).toBeFalse();
    expect(mockSettingsService.saveSettings).toHaveBeenCalled();
    expect(mockPrintService.print).toHaveBeenCalledWith(
      "2026 Championship-SeasonResults",
      true,
      undefined,
      false,
    );
  });

  it("should handle PDF export cancellation", () => {
    component.showPdfExportDialog = true;
    component.onPdfExportCancel();
    expect(component.showPdfExportDialog).toBeFalse();
  });
});
