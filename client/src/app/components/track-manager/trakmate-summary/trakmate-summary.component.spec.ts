import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TrackmateConfig } from "@app/models/track";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { PinBehavior } from "@app/proto/antigravity";
import { TranslationService } from "@app/services/translation.service";
import { TranslationServiceMock } from "@app/testing/translation-service.mock";

import { TrakmateSummaryComponent } from "./trakmate-summary.component";

describe("TrakmateSummaryComponent", () => {
  let component: TrakmateSummaryComponent;
  let fixture: ComponentFixture<TrakmateSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TrakmateSummaryComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useClass: TranslationServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrakmateSummaryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("config", {
      name: "Trakmate 1",
      commPort: "COM1",
      lapPinBehaviors: [
        PinBehavior.BEHAVIOR_LAP_BASE,
        PinBehavior.BEHAVIOR_LAP_BASE + 1,
      ],
      numLanes: 2,
      normallyClosedRelays: true,
      normallyClosedLaneSensors: false,
      useIR: false,
      debounce: 1,
      hasPerLaneRelays: false,
      lapPinPitBehavior: 0,
    } as TrackmateConfig);
    fixture.componentRef.setInput("index", 0);
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should toggle expanded state", () => {
    expect(component.isExpanded).toBeTrue();
    component.toggleExpanded();
    expect(component.isExpanded).toBeFalse();
    component.toggleExpanded();
    expect(component.isExpanded).toBeTrue();
  });

  describe("hasPitRow", () => {
    it("should return false if config is missing", () => {
      fixture.componentRef.setInput("config", undefined);
      fixture.detectChanges();
      expect(component.hasPitRow()).toBeFalse();
    });

    it("should return false if lapPinBehaviors is missing", () => {
      fixture.componentRef.setInput("config", {
        name: "Test",
      } as Partial<TrackmateConfig>);
      fixture.detectChanges();
      expect(component.hasPitRow()).toBeFalse();
    });

    it("should return false if no pit behaviors are present", () => {
      fixture.componentRef.setInput("config", {
        lapPinBehaviors: [
          PinBehavior.BEHAVIOR_LAP_BASE,
          PinBehavior.BEHAVIOR_LAP_BASE + 1,
        ],
      } as Partial<TrackmateConfig>);
      fixture.detectChanges();
      expect(component.hasPitRow()).toBeFalse();
    });

    it("should return true if pit in behavior is present", () => {
      fixture.componentRef.setInput("config", {
        lapPinBehaviors: [
          PinBehavior.BEHAVIOR_PIT_IN_BASE,
          PinBehavior.BEHAVIOR_LAP_BASE + 1,
        ],
      } as Partial<TrackmateConfig>);
      fixture.detectChanges();
      expect(component.hasPitRow()).toBeTrue();
    });

    it("should return true if pit out behavior is present", () => {
      fixture.componentRef.setInput("config", {
        lapPinBehaviors: [
          PinBehavior.BEHAVIOR_PIT_OUT_BASE,
          PinBehavior.BEHAVIOR_LAP_BASE + 1,
        ],
      } as Partial<TrackmateConfig>);
      fixture.detectChanges();
      expect(component.hasPitRow()).toBeTrue();
    });

    it("should return true if pit in/out behavior is present", () => {
      fixture.componentRef.setInput("config", {
        lapPinBehaviors: [
          PinBehavior.BEHAVIOR_PIT_IN_OUT_BASE,
          PinBehavior.BEHAVIOR_LAP_BASE + 1,
        ],
      } as Partial<TrackmateConfig>);
      fixture.detectChanges();
      expect(component.hasPitRow()).toBeTrue();
    });
  });
});
