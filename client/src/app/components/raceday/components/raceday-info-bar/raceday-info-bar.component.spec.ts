import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Race } from "@app/models/race";
import { Track } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { Heat } from "@app/race/heat";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayInfoBarComponent } from "./raceday-info-bar.component";
import { RacedayInfoBarHarness } from "./testing/raceday-info-bar.harness";

describe("RacedayInfoBarComponent", () => {
  let component: RacedayInfoBarComponent;
  let fixture: ComponentFixture<RacedayInfoBarComponent>;
  let harness: RacedayInfoBarHarness;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [RacedayInfoBarComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayInfoBarComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayInfoBarHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display empty content when inputs are missing", async () => {
    expect(await harness.getRaceName()).toBe("");
    expect(await harness.getHeatStatus()).toBe("");
    expect(await harness.getTrackName()).toBe("");
  });

  it("should display race name, track name, and heat info when inputs are provided", async () => {
    fixture.componentRef.setInput("race", {
      name: "Mock GP",
      group_options: { enabled: false },
    } as Race);
    fixture.componentRef.setInput("track", { name: "Mock Track" } as Track);
    fixture.componentRef.setInput("heat", { heatNumber: 2, group: 0 } as Heat);
    fixture.componentRef.setInput("totalHeats", 5);

    fixture.detectChanges();

    expect(await harness.getRaceName()).toBe("Mock GP");
    expect((await harness.getHeatStatus()).trim()).toBe("2 of 5");
    expect(await harness.getTrackName()).toBe("Mock Track");
  });

  it("should show group info if group options are enabled", async () => {
    fixture.componentRef.setInput("race", {
      name: "Mock GP",
      group_options: { enabled: true },
    } as Race);
    fixture.componentRef.setInput("track", { name: "Mock Track" } as Track);
    fixture.componentRef.setInput("heat", { heatNumber: 2, group: 1 } as Heat); // group 1 is Group 2 in UI (group + 1)
    fixture.componentRef.setInput("totalHeats", 5);

    fixture.detectChanges();

    // Translates "RE_GROUPS_LABEL" -> "RE_GROUPS_LABEL"
    expect(await harness.getHeatStatus()).toContain("RE_GROUPS_LABEL: 2");
  });
});
