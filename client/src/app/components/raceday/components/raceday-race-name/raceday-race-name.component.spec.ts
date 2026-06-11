import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Race } from "@app/models/race";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayRaceNameComponent } from "./raceday-race-name.component";
import { RacedayRaceNameHarness } from "./testing/raceday-race-name.harness";

describe("RacedayRaceNameComponent", () => {
  let component: RacedayRaceNameComponent;
  let fixture: ComponentFixture<RacedayRaceNameComponent>;
  let harness: RacedayRaceNameHarness;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [RacedayRaceNameComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayRaceNameComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayRaceNameHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display empty content when inputs are missing", async () => {
    expect(await harness.getLabel()).toBe("");
    expect(await harness.getRaceName()).toBe("");
  });

  it("should display race name and localized label when input is provided", async () => {
    fixture.componentRef.setInput("race", {
      name: "Championship Race",
    } as Race);

    fixture.detectChanges();

    expect(await harness.getLabel()).toBe("RD_LABEL_RACE");
    expect(await harness.getRaceName()).toBe("Championship Race");
  });
});
