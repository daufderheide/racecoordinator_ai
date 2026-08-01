import { CommonModule } from "@angular/common";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { of } from "rxjs";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { RacePredictionService } from "@app/services/race-prediction.service";
import { TranslationService } from "@app/services/translation.service";

import { DefaultPredictionResultsComponent } from "./default-prediction-results.component";

describe("DefaultPredictionResultsComponent", () => {
  let component: DefaultPredictionResultsComponent;
  let fixture: ComponentFixture<DefaultPredictionResultsComponent>;

  const mockTranslationService = {
    translate: (key: string) => key,
  };

  const mockRaceConnectionService = {
    race$: of(null),
  };

  const mockRaceService = {
    getRace: () => ({ entity_id: "race_1", name: "Test Race" }),
  };

  const mockRacePredictionService = {
    getRacePredictions: () => of(null),
    getPredictionEvaluation: () => of(null),
  };

  beforeEach(async () => {
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
});
