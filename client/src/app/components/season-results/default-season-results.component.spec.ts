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
    getRace: jasmine.createSpy("getRace").and.returnValue(null),
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

    mockRaceService.getRace.and.returnValue(null);

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

  it("should connect on init and disconnect on destroy", () => {
    expect(mockRaceConnectionService.connect).toHaveBeenCalled();
    fixture.destroy();
    expect(mockRaceConnectionService.disconnect).toHaveBeenCalledWith();
  });

  it("should disconnect on pagehide", () => {
    mockRaceConnectionService.connect.calls.reset();
    mockRaceConnectionService.disconnect.calls.reset();

    component.onPageHide();

    expect(mockRaceConnectionService.disconnect).toHaveBeenCalledWith();
  });

  it("should toggle race expansion", () => {
    fixture.detectChanges();
    expect(component.isRaceExpanded("r1")).toBeFalse();
    component.toggleRaceExpanded("r1");
    expect(component.isRaceExpanded("r1")).toBeTrue();
    component.toggleRaceExpanded("r1");
    expect(component.isRaceExpanded("r1")).toBeFalse();
  });

  it("should toggle race expansion independently for multiple runs of same race", () => {
    const race1 = {
      race_id: "race_template_1",
      race_name: "Club Sprint",
      timestamp: 1000,
      driver_results: [],
    };
    const race2 = {
      race_id: "race_template_1",
      race_name: "Club Sprint",
      timestamp: 2000,
      driver_results: [],
    };
    component.season = {
      name: "Season 1",
      drops: 0,
      races: [race1, race2],
    };
    fixture.detectChanges();

    expect(component.isRaceExpanded(race1, 0)).toBeFalse();
    expect(component.isRaceExpanded(race2, 1)).toBeFalse();

    component.toggleRaceExpanded(race1, 0);
    expect(component.isRaceExpanded(race1, 0)).toBeTrue();
    expect(component.isRaceExpanded(race2, 1)).toBeFalse();

    component.toggleRaceExpanded(race2, 1);
    expect(component.isRaceExpanded(race1, 0)).toBeTrue();
    expect(component.isRaceExpanded(race2, 1)).toBeTrue();
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
    // Total is 35 (10 + 25), with 1 drop (drops lowest 10), net points should be 25, dropped points should be 10
    expect(component.standings[0].gross_points).toBe(35);
    expect(component.standings[0].net_points).toBe(25);
    expect(component.standings[0].dropped_points).toBe(10);
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

  it("should correctly map live race bonus points to race breakdown scores", () => {
    mockRaceService.getRace.and.returnValue({
      entity_id: "live_race_1",
      name: "Championship Race 1",
      is_season: true,
      season_standings: [
        {
          driver_id: "d1",
          driver_name: "Driver 1",
          net_points: 18,
          gross_points: 18,
          races_run: 1,
          current_race_points: 18,
          current_race_overall_points: 10,
          current_race_overall_bonus_points: 3,
          current_race_heat_points: 0,
          current_race_heat_bonus_points: 5,
          current_race_overall_rank: 1,
        },
      ],
    } as any);

    component.season = {
      name: "Season 1",
      drops: 0,
      races: [],
    };

    component.calculateStandings();

    expect(component.standings.length).toBe(1);
    const standing = component.standings[0];
    expect(standing.race_scores?.length).toBe(1);
    const score = standing.race_scores![0];
    expect(score.overall_points).toBe(10);
    expect(score.overall_bonus_points).toBe(3);
    expect(score.heat_points).toBe(0);
    expect(score.heat_bonus_points).toBe(5);
    expect(score.total_points).toBe(18);
  });

  it("should toggle driver row expansion correctly", () => {
    fixture.detectChanges();
    expect(component.isDriverExpanded("r1", "d1")).toBeFalse();

    component.toggleDriverExpanded("r1", "d1");
    expect(component.isDriverExpanded("r1", "d1")).toBeTrue();

    component.toggleDriverExpanded("r1", "d1");
    expect(component.isDriverExpanded("r1", "d1")).toBeFalse();
  });

  it("should extract overall and heat bonus breakdown entries correctly", () => {
    const driverResult = {
      driver_id: "d1",
      driver_name: "Driver 1",
      overall_rank: 1,
      overall_points: 25,
      overall_bonus_points: 20,
      overall_bonus_breakdown: {
        fastest_lap: 15,
        fastest_lap_per_lane: 5,
        led_lap: 0,
      },
      heat_points: 10,
      heat_bonus_points: 7,
      heat_bonus_breakdown: {
        fastest_lap: 5,
        led_lap: 2,
      },
      total_points: 62,
    };

    expect(component.hasAnyBonuses(driverResult)).toBeTrue();

    const overallEntries = component.getOverallBonusEntries(driverResult);
    expect(overallEntries.length).toBe(2);
    expect(overallEntries.find((e) => e.key === "fastest_lap")?.points).toBe(
      15,
    );
    expect(
      overallEntries.find((e) => e.key === "fastest_lap_per_lane")?.points,
    ).toBe(5);

    const heatEntries = component.getHeatBonusEntries(driverResult);
    expect(heatEntries.length).toBe(2);
    expect(heatEntries.find((e) => e.key === "fastest_lap")?.points).toBe(5);
    expect(heatEntries.find((e) => e.key === "led_lap")?.points).toBe(2);

    const noBonusDriver = {
      driver_id: "d2",
      driver_name: "Driver 2",
      overall_rank: 2,
      overall_points: 18,
      overall_bonus_points: 0,
      heat_points: 8,
      heat_bonus_points: 0,
      total_points: 26,
    };

    expect(component.hasAnyBonuses(noBonusDriver)).toBeFalse();
    expect(component.getOverallBonusEntries(noBonusDriver).length).toBe(0);
    expect(component.getHeatBonusEntries(noBonusDriver).length).toBe(0);
  });

  it("should handle unknown bonus keys gracefully in getOverallBonusEntries and getHeatBonusEntries", () => {
    const customBonusDriver = {
      driver_id: "d3",
      driver_name: "Driver 3",
      overall_rank: 1,
      overall_points: 25,
      overall_bonus_points: 10,
      overall_bonus_breakdown: {
        custom_award: 10,
      },
      heat_points: 5,
      heat_bonus_points: 4,
      heat_bonus_breakdown: {
        custom_heat_award: 4,
      },
      total_points: 44,
    };

    const overallEntries = component.getOverallBonusEntries(customBonusDriver);
    expect(overallEntries.length).toBe(1);
    expect(overallEntries[0].key).toBe("custom_award");
    expect(overallEntries[0].labelKey).toBe("custom_award");
    expect(overallEntries[0].points).toBe(10);

    const heatEntries = component.getHeatBonusEntries(customBonusDriver);
    expect(heatEntries.length).toBe(1);
    expect(heatEntries[0].key).toBe("custom_heat_award");
    expect(heatEntries[0].labelKey).toBe("custom_heat_award");
    expect(heatEntries[0].points).toBe(4);
  });

  it("should parse lane-specific fastest lap bonus entries with params", () => {
    const laneBonusDriver = {
      driver_id: "d_lane",
      driver_name: "Lane Master",
      overall_rank: 1,
      overall_points: 25,
      overall_bonus_points: 10,
      overall_bonus_breakdown: {
        fastest_lap_lane_1: 5,
        fastest_lap_lane_3: 5,
      },
      heat_points: 0,
      heat_bonus_points: 0,
      total_points: 35,
    };

    const overallEntries = component.getOverallBonusEntries(laneBonusDriver);
    expect(overallEntries.length).toBe(2);

    const lane1 = overallEntries.find((e) => e.key === "fastest_lap_lane_1");
    expect(lane1).toBeDefined();
    expect(lane1?.labelKey).toBe("SS_BONUS_FASTEST_LAP_LANE_NUM");
    expect(lane1?.params).toEqual({ lane: "1" });
    expect(lane1?.points).toBe(5);

    const lane3 = overallEntries.find((e) => e.key === "fastest_lap_lane_3");
    expect(lane3).toBeDefined();
    expect(lane3?.labelKey).toBe("SS_BONUS_FASTEST_LAP_LANE_NUM");
    expect(lane3?.params).toEqual({ lane: "3" });
    expect(lane3?.points).toBe(5);
  });

  it("should parse both overall fastest lap and per-lane fastest lap entries on same driver", () => {
    const multiBonusDriver = {
      driver_id: "d_multi",
      driver_name: "Multi Champion",
      overall_rank: 1,
      overall_points: 50,
      overall_bonus_points: 25,
      overall_bonus_breakdown: {
        fastest_lap: 15,
        fastest_lap_lane_2: 5,
        fastest_lap_lane_4: 5,
      },
      heat_points: 0,
      heat_bonus_points: 0,
      total_points: 75,
    };

    const overallEntries = component.getOverallBonusEntries(multiBonusDriver);
    expect(overallEntries.length).toBe(3);

    const overallFastest = overallEntries.find((e) => e.key === "fastest_lap");
    expect(overallFastest).toBeDefined();
    expect(overallFastest?.labelKey).toBe("SS_BONUS_FASTEST_LAP");
    expect(overallFastest?.points).toBe(15);
    expect(overallFastest?.params).toBeUndefined();

    const lane2 = overallEntries.find((e) => e.key === "fastest_lap_lane_2");
    expect(lane2).toBeDefined();
    expect(lane2?.labelKey).toBe("SS_BONUS_FASTEST_LAP_LANE_NUM");
    expect(lane2?.params).toEqual({ lane: "2" });
    expect(lane2?.points).toBe(5);

    const lane4 = overallEntries.find((e) => e.key === "fastest_lap_lane_4");
    expect(lane4).toBeDefined();
    expect(lane4?.labelKey).toBe("SS_BONUS_FASTEST_LAP_LANE_NUM");
    expect(lane4?.params).toEqual({ lane: "4" });
    expect(lane4?.points).toBe(5);
  });

  it("should parse heat-specific bonus entries (fastest lap, led lap, most laps led) with params", () => {
    const heatBonusDriver = {
      driver_id: "d_heat",
      driver_name: "Heat Hero",
      overall_rank: 1,
      overall_points: 25,
      overall_bonus_points: 0,
      heat_points: 15,
      heat_bonus_points: 12,
      heat_bonus_breakdown: {
        fastest_lap_heat_1: 5,
        led_lap_heat_2: 2,
        most_laps_led_heat_3: 5,
      },
      total_points: 52,
    };

    const heatEntries = component.getHeatBonusEntries(heatBonusDriver);
    expect(heatEntries.length).toBe(3);

    const flHeat1 = heatEntries.find((e) => e.key === "fastest_lap_heat_1");
    expect(flHeat1).toBeDefined();
    expect(flHeat1?.labelKey).toBe("SS_BONUS_FASTEST_LAP_HEAT_NUM");
    expect(flHeat1?.params).toEqual({ heat: "1" });
    expect(flHeat1?.points).toBe(5);

    const llHeat2 = heatEntries.find((e) => e.key === "led_lap_heat_2");
    expect(llHeat2).toBeDefined();
    expect(llHeat2?.labelKey).toBe("SS_BONUS_LED_LAP_HEAT_NUM");
    expect(llHeat2?.params).toEqual({ heat: "2" });
    expect(llHeat2?.points).toBe(2);

    const mllHeat3 = heatEntries.find((e) => e.key === "most_laps_led_heat_3");
    expect(mllHeat3).toBeDefined();
    expect(mllHeat3?.labelKey).toBe("SS_BONUS_MOST_LAPS_LED_HEAT_NUM");
    expect(mllHeat3?.params).toEqual({ heat: "3" });
    expect(mllHeat3?.points).toBe(5);
  });

  it("should sort overall bonus entries by highest point value first", () => {
    const driver = {
      driver_id: "d_sort_overall",
      driver_name: "Sort Overall Driver",
      overall_rank: 1,
      overall_points: 25,
      overall_bonus_points: 40,
      overall_bonus_breakdown: {
        fastest_lap_lane_2: 4,
        most_laps_led: 25,
        fastest_lap_lane_1: 4,
        led_lap: 2,
        fastest_lap: 10,
      },
      heat_points: 0,
      heat_bonus_points: 0,
      total_points: 65,
    };

    const overallEntries = component.getOverallBonusEntries(driver);
    expect(overallEntries.length).toBe(5);
    expect(overallEntries[0].key).toBe("most_laps_led");
    expect(overallEntries[0].points).toBe(25);
    expect(overallEntries[1].key).toBe("fastest_lap");
    expect(overallEntries[1].points).toBe(10);
    expect(overallEntries[2].key).toBe("fastest_lap_lane_1");
    expect(overallEntries[2].points).toBe(4);
    expect(overallEntries[3].key).toBe("fastest_lap_lane_2");
    expect(overallEntries[3].points).toBe(4);
    expect(overallEntries[4].key).toBe("led_lap");
    expect(overallEntries[4].points).toBe(2);
  });

  it("should sort heat bonus entries by earliest heat first, then highest point value", () => {
    const driver = {
      driver_id: "d_sort_heat",
      driver_name: "Sort Heat Driver",
      overall_rank: 1,
      overall_points: 25,
      overall_bonus_points: 0,
      heat_points: 20,
      heat_bonus_points: 22,
      heat_bonus_breakdown: {
        fastest_lap_heat_2: 5,
        led_lap_heat_1: 2,
        most_laps_led_heat_1: 8,
        fastest_lap_heat_1: 5,
        led_lap_heat_3: 2,
      },
      total_points: 47,
    };

    const heatEntries = component.getHeatBonusEntries(driver);
    expect(heatEntries.length).toBe(5);

    // Heat 1: most_laps_led_heat_1 (8), fastest_lap_heat_1 (5), led_lap_heat_1 (2)
    expect(heatEntries[0].key).toBe("most_laps_led_heat_1");
    expect(heatEntries[0].points).toBe(8);
    expect(heatEntries[1].key).toBe("fastest_lap_heat_1");
    expect(heatEntries[1].points).toBe(5);
    expect(heatEntries[2].key).toBe("led_lap_heat_1");
    expect(heatEntries[2].points).toBe(2);

    // Heat 2: fastest_lap_heat_2 (5)
    expect(heatEntries[3].key).toBe("fastest_lap_heat_2");
    expect(heatEntries[3].points).toBe(5);

    // Heat 3: led_lap_heat_3 (2)
    expect(heatEntries[4].key).toBe("led_lap_heat_3");
    expect(heatEntries[4].points).toBe(2);
  });

  it("should render driver bonus breakdown correctly in the DOM when driver row is clicked", () => {
    fixture.detectChanges(); // Run ngOnInit first

    const customSeason = {
      name: "Championship 2026",
      drops: 0,
      races: [
        {
          race_id: "race_bonus_1",
          race_name: "Feature Race",
          timestamp: 1000,
          driver_results: [
            {
              driver_id: "driver_winner",
              driver_name: "Winner Driver",
              overall_rank: 1,
              overall_points: 25,
              overall_bonus_points: 15,
              overall_bonus_breakdown: {
                fastest_lap: 10,
                most_laps_led: 5,
              },
              heat_points: 8,
              heat_bonus_points: 3,
              heat_bonus_breakdown: {
                fastest_lap: 3,
              },
              total_points: 51,
            },
            {
              driver_id: "driver_no_bonus",
              driver_name: "Zero Bonus Driver",
              overall_rank: 2,
              overall_points: 18,
              overall_bonus_points: 0,
              heat_points: 5,
              heat_bonus_points: 0,
              total_points: 23,
            },
          ],
        },
      ],
    };

    component.season = customSeason;
    component.calculateStandings();
    component.toggleRaceExpanded("race_bonus_1");
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const raceTable = compiled.querySelector(".race-breakdown-table");
    expect(raceTable).not.toBeNull();

    const driverRows = compiled.querySelectorAll(".driver-expandable-row");
    expect(driverRows.length).toBe(2);

    // Click winner driver row to expand bonus breakdown
    (driverRows[0] as HTMLElement).click();
    fixture.detectChanges();

    expect(
      component.isDriverExpanded("race_bonus_1", "driver_winner"),
    ).toBeTrue();

    const bonusRows = compiled.querySelectorAll(".driver-bonus-details-row");
    expect(bonusRows.length).toBe(2);
    expect(
      bonusRows[0].classList.contains("driver-bonus-collapsed"),
    ).toBeFalse();

    const winnerBonusItems = bonusRows[0].querySelectorAll(".bonus-entry-item");
    // Winner has 2 overall bonuses + 1 heat bonus = 3 items
    expect(winnerBonusItems.length).toBe(3);

    // Expand second driver with no bonuses
    (driverRows[1] as HTMLElement).click();
    fixture.detectChanges();

    expect(
      component.isDriverExpanded("race_bonus_1", "driver_no_bonus"),
    ).toBeTrue();
    const noBonusMsgs = bonusRows[1].querySelectorAll(".no-bonuses-msg");
    expect(noBonusMsgs.length).toBe(2); // One for overall, one for heat
  });

  it("should append live race with breakdown maps properly", () => {
    mockRaceService.getRace.and.returnValue({
      entity_id: "live_123",
      name: "Active Live Race",
      is_season: true,
      season_id: "season_live_test",
      season_standings: [
        {
          driver_id: "driver_live",
          driver_name: "Live Racer",
          net_points: 40,
          gross_points: 40,
          races_run: 1,
          current_race_points: 40,
          current_race_overall_points: 25,
          current_race_overall_bonus_points: 5,
          current_race_overall_bonus_breakdown: {
            fastest_lap: 5,
          },
          current_race_heat_points: 8,
          current_race_heat_bonus_points: 2,
          current_race_heat_bonus_breakdown: {
            led_lap: 2,
          },
          current_race_overall_rank: 1,
        },
      ],
    } as any);

    component.season = {
      entity_id: "season_live_test",
      name: "Live Season",
      drops: 0,
      races: [],
    };

    component.calculateStandings();

    expect(component.standings.length).toBe(1);
    const standing = component.standings[0];
    expect(standing.driver_name).toBe("Live Racer");
    expect(standing.race_scores?.length).toBe(1);
    const score = standing.race_scores![0];
    expect(score.overall_points).toBe(25);
    expect(score.overall_bonus_points).toBe(5);
    expect(score.overall_bonus_breakdown).toEqual({ fastest_lap: 5 });
    expect(score.heat_points).toBe(8);
    expect(score.heat_bonus_points).toBe(2);
    expect(score.heat_bonus_breakdown).toEqual({ led_lap: 2 });
  });

  it("should limit all decimal values to at most 2 decimal places in the template", () => {
    fixture.detectChanges(); // Run ngOnInit first

    component.season = {
      name: "Decimal Precision Season",
      drops: 0,
      races: [
        {
          race_id: "race_dec_1",
          race_name: "Decimal GP",
          timestamp: 2000,
          driver_results: [
            {
              driver_id: "driver_dec",
              driver_name: "Precision Driver",
              overall_rank: 1,
              overall_points: 25.12345,
              overall_bonus_points: 5.6789,
              overall_bonus_breakdown: {
                fastest_lap: 5.6789,
              },
              heat_points: 8.333333,
              heat_bonus_points: 2.5,
              heat_bonus_breakdown: {
                led_lap: 2.5,
              },
              total_points: 41.635683,
            },
          ],
        },
      ],
    };

    component.calculateStandings();
    component.toggleRaceExpanded("race_dec_1");
    component.toggleDriverExpanded("race_dec_1", "driver_dec");
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // Check Standings table points
    const standingsNetPts = compiled.querySelector(
      ".standings-table .net-highlight strong",
    );
    expect(standingsNetPts?.textContent?.trim()).toBe("41.64");

    const standingsDroppedPts = compiled.querySelector(
      ".standings-table tbody td:nth-child(4)",
    );
    expect(standingsDroppedPts?.textContent?.trim()).toBe("0");

    const standingsGrossPts = compiled.querySelector(
      ".standings-table tbody td:nth-child(5)",
    );
    expect(standingsGrossPts?.textContent?.trim()).toBe("41.64");

    // Check Race Breakdown table row points
    const breakdownCells = compiled.querySelectorAll(
      ".driver-expandable-row td",
    );
    // td[2]: overall_points (25.12)
    expect(breakdownCells[2].textContent?.trim()).toBe("25.12");
    // td[3]: overall_bonus_points (5.68)
    expect(breakdownCells[3].textContent?.trim()).toBe("5.68");
    // td[4]: heat_points (8.33)
    expect(breakdownCells[4].textContent?.trim()).toBe("8.33");
    // td[5]: heat_bonus_points (2.5)
    expect(breakdownCells[5].textContent?.trim()).toBe("2.5");
    // td[6]: total_points (41.64)
    expect(breakdownCells[6].textContent?.trim()).toBe("41.64");

    // Check Bonus Details cards
    const bonusTotals = compiled.querySelectorAll(".bonus-card-total");
    expect(bonusTotals[0].textContent?.trim()).toBe("5.68 pts");
    expect(bonusTotals[1].textContent?.trim()).toBe("2.5 pts");

    const bonusItemPoints = compiled.querySelectorAll(".bonus-item-points");
    expect(bonusItemPoints[0].textContent?.trim()).toBe("+5.68");
    expect(bonusItemPoints[1].textContent?.trim()).toBe("+2.5");
  });

  it("should calculate uniform scale on resize", () => {
    spyOnProperty(window, "innerWidth", "get").and.returnValue(960);
    spyOnProperty(window, "innerHeight", "get").and.returnValue(1080);

    component.onResize();
    // Target width=1920, height=1080
    // scaleX = 960 / 1920 = 0.5
    // scaleY = 1080 / 1080 = 1.0
    // uniform scale = min(0.5, 1.0) = 0.5
    expect(component.scale).toBeCloseTo(0.5, 3);
  });

  it("should render drops count meta-pill and dropped points column in standings table", () => {
    fixture.detectChanges(); // Run ngOnInit first

    component.season = {
      entity_id: "s_drops_display",
      name: "Championship 2026",
      drops: 2,
      races: [
        {
          race_id: "r1",
          race_name: "Race 1",
          timestamp: 1000,
          driver_results: [
            {
              driver_id: "d1",
              driver_name: "Top Racer",
              overall_rank: 1,
              overall_points: 25,
              heat_points: 0,
              total_points: 25,
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
              driver_name: "Top Racer",
              overall_rank: 2,
              overall_points: 10,
              heat_points: 0,
              total_points: 10,
            },
          ],
        },
        {
          race_id: "r3",
          race_name: "Race 3",
          timestamp: 3000,
          driver_results: [
            {
              driver_id: "d1",
              driver_name: "Top Racer",
              overall_rank: 1,
              overall_points: 30,
              heat_points: 0,
              total_points: 30,
            },
          ],
        },
      ],
    };

    component.calculateStandings();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    // Verify panel header has drops count pill
    const metaPills = compiled.querySelectorAll(".panel-header .meta-pill");
    expect(metaPills.length).toBe(2);
    expect(metaPills[0].textContent).toContain("SM_DROPS_COUNT");
    expect(metaPills[0].querySelector("strong")?.textContent).toBe("2");
    expect(metaPills[1].textContent).toContain("SM_RACES_RUN");
    expect(metaPills[1].querySelector("strong")?.textContent).toBe("3");

    // Verify standings table headers have 6 columns including SM_DROPPED_POINTS
    const headers = compiled.querySelectorAll(".standings-table thead th");
    expect(headers.length).toBe(6);
    expect(headers[0].textContent?.trim()).toBe("SM_RANK");
    expect(headers[1].textContent?.trim()).toBe("SM_DRIVER");
    expect(headers[2].textContent?.trim()).toBe("SM_NET_POINTS");
    expect(headers[3].textContent?.trim()).toBe("SM_DROPPED_POINTS");
    expect(headers[4].textContent?.trim()).toBe("SM_GROSS_POINTS");
    expect(headers[5].textContent?.trim()).toBe("SM_RACES");

    // Verify standings row values
    const rowCells = compiled.querySelectorAll(
      ".standings-table tbody tr:first-child td",
    );
    expect(rowCells.length).toBe(6);
    // Gross = 25 + 10 + 30 = 65, Drops = 2 lowest (10, 25) = 35 dropped, Net = 30
    expect(rowCells[1].textContent?.trim()).toBe("Top Racer");
    expect(rowCells[2].textContent?.trim()).toBe("30");
    expect(rowCells[3].textContent?.trim()).toBe("35");
    expect(rowCells[4].textContent?.trim()).toBe("65");
    expect(rowCells[5].textContent?.trim()).toBe("3");
  });
});
