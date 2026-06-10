import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayTimerComponent } from "./raceday-timer.component";
import { RacedayTimerHarness } from "./testing/raceday-timer.harness";

describe("RacedayTimerComponent", () => {
  let component: RacedayTimerComponent;
  let fixture: ComponentFixture<RacedayTimerComponent>;
  let harness: RacedayTimerHarness;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [RacedayTimerComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayTimerComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayTimerHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should render time string and handle conditional labels", async () => {
    component.formattedTime = "02:30.000";
    component.autoStatusLabel = "";
    component.isWarmup = false;
    component.showCountdownOverlay = false;

    fixture.detectChanges();

    expect(await harness.getTimeText()).toBe("02:30.000");
    expect(await harness.getStatusLabel()).toBeNull();
    expect(await harness.getWarmupLabel()).toBeNull();

    // With warmup and status labels active
    component.autoStatusLabel = "RD_PAUSED";
    component.isWarmup = true;
    fixture.detectChanges();

    expect(await harness.getStatusLabel()).toBe("RD_PAUSED");
    expect(await harness.getWarmupLabel()).toBe("RD_WARMUP");

    // Hide status label when countdown overlay is active
    component.showCountdownOverlay = true;
    fixture.detectChanges();

    expect(await harness.getStatusLabel()).toBeNull();
  });
});
