import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";
import { mockTranslationService } from "@app/testing/unit-test-mocks";

import { RacedayEventNameComponent } from "./raceday-event-name.component";
import { RacedayEventNameHarness } from "./testing/raceday-event-name.harness";

describe("RacedayEventNameComponent", () => {
  let component: RacedayEventNameComponent;
  let fixture: ComponentFixture<RacedayEventNameComponent>;
  let harness: RacedayEventNameHarness;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [RacedayEventNameComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RacedayEventNameComponent);
    component = fixture.componentInstance;
    harness = await TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      RacedayEventNameHarness,
    );
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display empty content when inputs are missing", async () => {
    expect(await harness.getLabel()).toBe("");
    expect(await harness.getEventName()).toBe("");
  });

  it("should display event name and localized label when input is provided", async () => {
    fixture.componentRef.setInput("race", {
      name: "Heat 1",
      is_event: true,
      event_name: "Grand Championship",
    } as any);

    fixture.detectChanges();

    expect(await harness.getLabel()).toBe("RD_LABEL_EVENT");
    expect(await harness.getEventName()).toBe("Grand Championship");
  });
});
