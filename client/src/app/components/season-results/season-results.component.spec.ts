import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { DataService } from "@app/data.service";
import { LoggerService } from "@app/services/logger.service";
import { RaceService } from "@app/services/race.service";
import { RaceConnectionService } from "@app/services/race-connection.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";

import { SeasonResultsComponent } from "./season-results.component";

describe("SeasonResultsComponent", () => {
  let component: SeasonResultsComponent;
  let fixture: ComponentFixture<SeasonResultsComponent>;

  const mockDataService = {
    getSeasons: () => of([]),
  };

  const mockRaceService = {
    selectedRace$: of(null),
    heats$: of([]),
    getRace: () => null,
  };

  const mockRaceConnectionService = {
    connect: jasmine.createSpy("connect"),
    disconnect: jasmine.createSpy("disconnect"),
  };

  const mockSettingsService = {
    getSettings: () => ({ selectedSeasonId: "" }),
  };

  const mockTranslationService = {
    translate: (key: string) => key,
  };

  const mockLoggerService = {
    error: jasmine.createSpy("error"),
    debug: jasmine.createSpy("debug"),
  };

  const mockActivatedRoute = {
    queryParamMap: of(new Map()),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonResultsComponent],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: RaceConnectionService, useValue: mockRaceConnectionService },
        { provide: RaceService, useValue: mockRaceService },
        { provide: SettingsService, useValue: mockSettingsService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SeasonResultsComponent);
    component = fixture.componentInstance;
  });

  it("should create SeasonResultsComponent wrapper", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
