import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { PinBehavior } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";
import { TranslationServiceMock } from "@app/testing/translation-service.mock";

import { BartSummaryComponent } from "./bart-summary.component";

describe("BartSummaryComponent", () => {
  let component: BartSummaryComponent;
  let fixture: ComponentFixture<BartSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BartSummaryComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useClass: TranslationServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BartSummaryComponent);
    component = fixture.componentInstance;
  });

  it("should create component", () => {
    expect(component).toBeTruthy();
  });

  it("should return correct device name", () => {
    fixture.componentRef.setInput("config", {
      name: "BART 1",
      deviceName: "BART_0001",
      deviceAddress: "AA:BB:CC:DD:EE:FF",
      numLanes: 4,
      minLapMs: 1000,
      lapPinPitBehavior: 0,
      lapPinBehaviors: [0, 1, 2, 3],
    });
    fixture.detectChanges();

    expect(component.getDeviceName()).toBe("BART_0001");
  });

  it("should calculate configured channel count", () => {
    fixture.componentRef.setInput("config", {
      name: "BART 1",
      deviceName: "BART_0001",
      deviceAddress: "",
      numLanes: 4,
      minLapMs: 1000,
      lapPinPitBehavior: 0,
      lapPinBehaviors: [
        PinBehavior.BEHAVIOR_LAP_BASE,
        PinBehavior.BEHAVIOR_LAP_BASE + 1,
        PinBehavior.BEHAVIOR_UNUSED,
        PinBehavior.BEHAVIOR_UNUSED,
      ],
    });
    fixture.detectChanges();

    expect(component.getConfiguredChannelCount()).toBe(2);
  });

  it("should detect behaviors correctly", () => {
    fixture.componentRef.setInput("config", {
      name: "BART 1",
      deviceName: "BART_0001",
      deviceAddress: "",
      numLanes: 4,
      minLapMs: 1000,
      lapPinPitBehavior: 1, // Pit In
      lapPinBehaviors: [
        PinBehavior.BEHAVIOR_LAP_BASE,
        PinBehavior.BEHAVIOR_PIT_OUT_BASE,
        PinBehavior.BEHAVIOR_CALL_BUTTON_BASE,
      ],
    });
    fixture.detectChanges();

    expect(component.hasBehavior("lap")).toBeTrue();
    expect(component.hasBehavior("pit_in")).toBeTrue();
    expect(component.hasBehavior("pit_out")).toBeTrue();
  });

  it("should return correct lap pin pit behavior text", () => {
    fixture.componentRef.setInput("config", {
      name: "BART 1",
      deviceName: "BART_0001",
      deviceAddress: "",
      numLanes: 4,
      minLapMs: 1000,
      lapPinPitBehavior: 0,
      lapPinBehaviors: [],
    });
    expect(component.getLapPinPitBehaviorText()).toBe("TME_LAP_PIN_PIT_NONE");

    fixture.componentRef.setInput("config", {
      name: "BART 1",
      deviceName: "BART_0001",
      deviceAddress: "",
      numLanes: 4,
      minLapMs: 1000,
      lapPinPitBehavior: 1,
      lapPinBehaviors: [],
    });
    expect(component.getLapPinPitBehaviorText()).toBe("TME_LAP_PIN_PIT_IN");

    fixture.componentRef.setInput("config", {
      name: "BART 1",
      deviceName: "BART_0001",
      deviceAddress: "",
      numLanes: 4,
      minLapMs: 1000,
      lapPinPitBehavior: 2,
      lapPinBehaviors: [],
    });
    expect(component.getLapPinPitBehaviorText()).toBe("TME_LAP_PIN_PIT_OUT");
  });

  it("should not render call button behavior checkbox in DOM", () => {
    fixture.componentRef.setInput("config", {
      name: "BART 1",
      deviceName: "BART_0001",
      deviceAddress: "",
      numLanes: 4,
      minLapMs: 1000,
      lapPinPitBehavior: 0,
      lapPinBehaviors: [PinBehavior.BEHAVIOR_LAP_BASE],
    });
    fixture.detectChanges();

    const behaviorLabels = Array.from(
      fixture.nativeElement.querySelectorAll(".behavior-label"),
    ).map((el: any) => el.textContent.trim());

    expect(behaviorLabels).not.toContain("AS_BEHAVIOR_CALL_BUTTONS");
  });

  it("should toggle section expansion", () => {
    expect(component.isExpanded).toBeTrue();
    component.toggleExpanded();
    expect(component.isExpanded).toBeFalse();
  });
});
