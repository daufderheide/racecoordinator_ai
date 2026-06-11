import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Race } from "@app/models/race";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { Heat } from "@app/race/heat";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayHeatInfoComponent } from "./raceday-heat-info.component";
import { RacedayHeatInfoHarness } from "./testing/raceday-heat-info.harness";

describe("RacedayHeatInfoComponent", () => {
  let component: RacedayHeatInfoComponent;
  let fixture: ComponentFixture<RacedayHeatInfoComponent>;
  let harness: RacedayHeatInfoHarness;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake(
      (key: string, params?: any) => {
        if (key === "RD_HEAT_OF_TOTAL" && params) {
          return `${params.current} of ${params.total}`;
        }
        return key;
      },
    );

    await TestBed.configureTestingModule({
      imports: [RacedayHeatInfoComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayHeatInfoComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayHeatInfoHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display empty content when inputs are missing", async () => {
    expect(await harness.getLabel()).toBe("");
    expect(await harness.getHeatStatus()).toBe("");
  });

  it("should display heat info when inputs are provided", async () => {
    fixture.componentRef.setInput("heat", { heatNumber: 3, group: 0 } as Heat);
    fixture.componentRef.setInput("totalHeats", 6);
    fixture.componentRef.setInput("race", {
      group_options: { enabled: false },
    } as Race);

    fixture.detectChanges();

    expect(await harness.getLabel()).toBe("RD_HEAT:");
    expect((await harness.getHeatStatus()).trim()).toBe("3 of 6");
  });

  it("should display group details when group options are enabled", async () => {
    fixture.componentRef.setInput("heat", { heatNumber: 3, group: 2 } as Heat);
    fixture.componentRef.setInput("totalHeats", 6);
    fixture.componentRef.setInput("race", {
      group_options: { enabled: true },
    } as Race);

    fixture.detectChanges();

    expect(await harness.getLabel()).toBe("RD_HEAT:");
    expect((await harness.getHeatStatus()).trim()).toBe(
      "3 of 6 - RE_GROUPS_LABEL: 3",
    );
  });
});
