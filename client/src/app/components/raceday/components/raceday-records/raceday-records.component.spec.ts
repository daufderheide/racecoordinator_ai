import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayRecordsComponent } from "./raceday-records.component";
import { RacedayRecordsHarness } from "./testing/raceday-records.harness";

describe("RacedayRecordsComponent", () => {
  let component: RacedayRecordsComponent;
  let fixture: ComponentFixture<RacedayRecordsComponent>;
  let harness: RacedayRecordsHarness;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [RacedayRecordsComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayRecordsComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayRecordsHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render default fallbacks when input records are empty", async () => {
    // Initial state
    const raceLap = await harness.getRecordRowValues(0);
    expect(raceLap.nickname).toBe("---");
    expect(raceLap.score).toBe("--.---");

    const raceScore = await harness.getRecordRowValues(1);
    expect(raceScore.nickname).toBe("---");
    expect(raceScore.score).toBe("--");

    const currentRaceBest = await harness.getRecordRowValues(2);
    expect(currentRaceBest.nickname).toBe("---");
    expect(currentRaceBest.score).toBe("--.---");

    const heatBest = await harness.getRecordRowValues(3);
    expect(heatBest.nickname).toBe("---");
    expect(heatBest.score).toBe("--.---");
  });

  it("should display record values and format time using decimal pipe when inputs are provided", async () => {
    fixture.componentRef.setInput("raceRecordLapNickname", "Alice");
    fixture.componentRef.setInput("raceRecordLapTime", 9.8765);

    fixture.componentRef.setInput("raceRecordScoreNickname", "Bob");
    fixture.componentRef.setInput("raceRecordScore", 12.3);

    fixture.componentRef.setInput("currentRaceBestNickname", "Charlie");
    fixture.componentRef.setInput("currentRaceBestTime", 10.45);

    fixture.componentRef.setInput("heatBestNickname", "Dave");
    fixture.componentRef.setInput("heatBestTime", 11.2345);

    fixture.detectChanges();

    const raceLap = await harness.getRecordRowValues(0);
    expect(raceLap.nickname).toBe("Alice");
    expect(raceLap.score).toBe("9.877"); // formatted 1.3-3

    const raceScore = await harness.getRecordRowValues(1);
    expect(raceScore.nickname).toBe("Bob");
    expect(raceScore.score).toBe("12.300"); // formatted 1.3-3

    const currentBest = await harness.getRecordRowValues(2);
    expect(currentBest.nickname).toBe("Charlie");
    expect(currentBest.score).toBe("10.450");

    const heatBest = await harness.getRecordRowValues(3);
    expect(heatBest.nickname).toBe("Dave");
    expect(heatBest.score).toBe("11.235");
  });
});
