import { CommonModule } from "@angular/common";
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { BehaviorSubject, of } from "rxjs";
import { RaceState } from "@app/proto/antigravity";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { RacePredictionService } from "@app/services/race-prediction.service";
import { TranslationService } from "@app/services/translation.service";

import { DefaultPredictionResultsComponent } from "./default-prediction-results.component";

describe("DefaultPredictionResultsComponent", () => {
  let component: DefaultPredictionResultsComponent;
  let fixture: ComponentFixture<DefaultPredictionResultsComponent>;
  let raceStateSubject: BehaviorSubject<RaceState>;

  const mockTranslationService = {
    translate: (key: string) => key,
  };

  const mockRaceService = {
    getRace: () => ({ entity_id: "race_1", name: "Test Race" }),
  };

  const mockRacePredictionService = {
    getRacePredictions: () => of(null),
    getPredictionEvaluation: () => of(null),
  };

  beforeEach(async () => {
    raceStateSubject = new BehaviorSubject<RaceState>(RaceState.NOT_STARTED);
    const mockRaceConnectionService = {
      race$: of(null),
      raceState$: raceStateSubject.asObservable(),
    };

    await TestBed.configureTestingModule({
      imports: [DefaultPredictionResultsComponent, CommonModule],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: RacePredictionService, useValue: mockRacePredictionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DefaultPredictionResultsComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display -- for projected rank when rank is -1", () => {
    const mockRecord = {
      race_id: "race_1",
      timestamp: 1000,
      pre_race: {
        heat_index: 0,
        completed_laps: 0,
        win_probabilities: { d1: -1.0 },
        podium_probabilities: { d1: -1.0 },
        projected_standings: [
          {
            driver_id: "d1",
            driver_name: "Alice",
            projected_rank: -1,
            projected_laps: -1.0,
            projected_time_seconds: 0,
            win_probability: -1.0,
            podium_probability: -1.0,
          },
        ],
        heat_forecasts: [],
      },
      realtime_snapshots: [],
    };

    mockRacePredictionService.getRacePredictions = () => of(mockRecord as any);

    fixture.detectChanges();

    const rankCols = fixture.debugElement.queryAll(By.css(".rank-col"));
    expect(rankCols.length).toBe(1);
    expect(rankCols[0].nativeElement.textContent.trim()).toBe("--");
  });

  it("should dynamically reload predictions when raceState changes to RACE_OVER", fakeAsync(() => {
    const getPredictionsSpy = spyOn(
      mockRacePredictionService,
      "getRacePredictions",
    ).and.callThrough();
    const getEvaluationSpy = spyOn(
      mockRacePredictionService,
      "getPredictionEvaluation",
    ).and.callThrough();

    fixture.detectChanges(); // initial load
    getPredictionsSpy.calls.reset();
    getEvaluationSpy.calls.reset();

    raceStateSubject.next(RaceState.RACE_OVER);
    fixture.detectChanges();

    expect(getPredictionsSpy).toHaveBeenCalled();
    expect(getEvaluationSpy).toHaveBeenCalled();

    tick(3500); // pass all scheduled reload timeouts
  }));

  it("should render standings table wrapper and scrollable rows for 20 drivers", () => {
    const standings = [];
    for (let i = 1; i <= 20; i++) {
      standings.push({
        driver_id: `d${i}`,
        driver_name: `Driver ${i}`,
        projected_rank: i,
        projected_laps: 50 - i,
        projected_time_seconds: 200,
        win_probability: i === 1 ? 0.5 : 0.02,
        podium_probability: i <= 3 ? 0.8 : 0.1,
      });
    }

    const mockRecord = {
      race_id: "race_20",
      timestamp: 2000,
      pre_race: {
        heat_index: 0,
        completed_laps: 0,
        win_probabilities: {},
        podium_probabilities: {},
        projected_standings: standings,
        heat_forecasts: [],
      },
      realtime_snapshots: [],
    };

    mockRacePredictionService.getRacePredictions = () => of(mockRecord as any);

    fixture.detectChanges();

    const tableWrapper = fixture.debugElement.query(
      By.css(".standings-table-wrapper"),
    );
    expect(tableWrapper).toBeTruthy();

    const rows = fixture.debugElement.queryAll(
      By.css(".prediction-table tbody tr"),
    );
    expect(rows.length).toBe(20);
    expect(rows[0].nativeElement.textContent).toContain("Driver 1");
    expect(rows[19].nativeElement.textContent).toContain("Driver 20");
  });
});
