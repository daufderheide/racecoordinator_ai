import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { of } from "rxjs";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { RacePredictionService } from "@app/services/race-prediction.service";
import { TranslationService } from "@app/services/translation.service";

import { DefaultPredictionResultsComponent } from "./default-prediction-results.component";
import { PredictionResultsComponent } from "./prediction-results.component";

describe("PredictionResultsComponent", () => {
  let component: PredictionResultsComponent;
  let fixture: ComponentFixture<PredictionResultsComponent>;

  const mockRaceConnectionService = {
    race$: of(null),
    connect: jasmine.createSpy("connect"),
    disconnect: jasmine.createSpy("disconnect"),
  };

  const mockRaceService = {
    getRace: () => ({ entity_id: "race_1", name: "Test Race" }),
  };

  const mockTranslationService = {
    translate: (key: string) => key,
  };

  const mockRacePredictionService = {
    getRacePredictions: () =>
      of({
        race_id: "race_1",
        timestamp: 1000,
        pre_race: {
          heat_index: 0,
          completed_laps: 0,
          win_probabilities: { d1: 0.7 },
          podium_probabilities: { d1: 0.9 },
          projected_standings: [
            {
              driver_id: "d1",
              driver_name: "Alice",
              projected_rank: 1,
              projected_laps: 50,
              projected_time_seconds: 0,
              win_probability: 0.7,
              podium_probability: 0.9,
            },
          ],
          heat_forecasts: [],
        },
        realtime_snapshots: [],
      }),
    getPredictionEvaluation: () => of(null),
  };

  beforeEach(async () => {
    mockRaceConnectionService.disconnect.calls.reset();
    mockRaceConnectionService.connect.calls.reset();

    TestBed.overrideComponent(DefaultPredictionResultsComponent, {
      set: {
        providers: [
          {
            provide: RacePredictionService,
            useValue: mockRacePredictionService,
          },
          {
            provide: RaceConnectionService,
            useValue: mockRaceConnectionService,
          },
          { provide: RaceService, useValue: mockRaceService },
          { provide: TranslationService, useValue: mockTranslationService },
        ],
      },
    });

    await TestBed.configureTestingModule({
      imports: [PredictionResultsComponent, HttpClientTestingModule],
      providers: [
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: RacePredictionService, useValue: mockRacePredictionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PredictionResultsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("should disconnect on ngOnDestroy and onPageHide", () => {
    const defaultDebugEl = fixture.debugElement.query(
      By.directive(DefaultPredictionResultsComponent),
    );
    const defaultComponent =
      defaultDebugEl.componentInstance as DefaultPredictionResultsComponent;
    defaultComponent.ngOnDestroy();
    expect(mockRaceConnectionService.disconnect).toHaveBeenCalledWith();

    mockRaceConnectionService.disconnect.calls.reset();
    defaultComponent.onPageHide();
    expect(mockRaceConnectionService.disconnect).toHaveBeenCalledWith();
  });
});
