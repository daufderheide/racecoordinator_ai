import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CameraConfig } from "@app/models/camera_config";
import { TranslatePipe } from "@app/pipes/translate.pipe";
import { TranslationService } from "@app/services/translation.service";
import { TranslationServiceMock } from "@app/testing/translation-service.mock";

import { CameraSummaryComponent } from "./camera-summary.component";

describe("CameraSummaryComponent", () => {
  let component: CameraSummaryComponent;
  let fixture: ComponentFixture<CameraSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CameraSummaryComponent, TranslatePipe],
      providers: [
        { provide: TranslationService, useClass: TranslationServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CameraSummaryComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("config", {
      name: "Test Camera",
      interfaceIndex: 0,
      targetFps: 60,
      autoDetectLanes: true,
      gates: [
        {
          laneIndex: 0,
          xPct: 0.1,
          yPct: 0.2,
          widthPct: 0.2,
          heightPct: 0.25,
          gateType: 0, // LAP
          sensitivity: 0.5,
        },
        {
          laneIndex: 1,
          xPct: 0.3,
          yPct: 0.2,
          widthPct: 0.2,
          heightPct: 0.25,
          gateType: 1, // SECTOR/SEGMENT
          sensitivity: 0.5,
        },
        {
          laneIndex: 2,
          xPct: 0.5,
          yPct: 0.2,
          widthPct: 0.2,
          heightPct: 0.25,
          gateType: 2, // PIT_IN
          sensitivity: 0.5,
        },
        {
          laneIndex: 3,
          xPct: 0.7,
          yPct: 0.2,
          widthPct: 0.2,
          heightPct: 0.25,
          gateType: 3, // PIT_OUT
          sensitivity: 0.5,
        },
      ],
    } as CameraConfig);
    fixture.componentRef.setInput("index", 1);
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

  describe("getDeviceName", () => {
    it("should return empty string if config is missing", () => {
      fixture.componentRef.setInput("config", undefined);
      fixture.detectChanges();
      expect(component.getDeviceName()).toBe("");
    });

    it("should return config name if present", () => {
      expect(component.getDeviceName()).toBe("Test Camera");
    });

    it("should return fallback translation key if name is empty", () => {
      fixture.componentRef.setInput("config", {
        name: "",
        interfaceIndex: 0,
        targetFps: 30,
        autoDetectLanes: false,
        gates: [],
      } as CameraConfig);
      fixture.detectChanges();
      expect(component.getDeviceName()).toBe("CS_DEFAULT_NAME");
    });
  });

  describe("getConfiguredGateCount", () => {
    it("should return 0 if config is missing", () => {
      fixture.componentRef.setInput("config", undefined);
      fixture.detectChanges();
      expect(component.getConfiguredGateCount()).toBe(0);
    });

    it("should return 0 if gates array is undefined", () => {
      fixture.componentRef.setInput("config", {
        name: "Test",
      } as any);
      fixture.detectChanges();
      expect(component.getConfiguredGateCount()).toBe(0);
    });

    it("should return correct count of gates", () => {
      expect(component.getConfiguredGateCount()).toBe(4);
    });
  });

  describe("hasBehavior", () => {
    it("should return false if config is missing", () => {
      fixture.componentRef.setInput("config", undefined);
      fixture.detectChanges();
      expect(component.hasBehavior("lap")).toBeFalse();
    });

    it("should return false if gates are missing", () => {
      fixture.componentRef.setInput("config", {
        name: "Test",
      } as any);
      fixture.detectChanges();
      expect(component.hasBehavior("lap")).toBeFalse();
    });

    it("should detect lap behavior", () => {
      expect(component.hasBehavior("lap")).toBeTrue();
      fixture.componentRef.setInput("config", {
        name: "No Laps",
        gates: [{ laneIndex: 0, gateType: 1 }],
      } as any);
      fixture.detectChanges();
      expect(component.hasBehavior("lap")).toBeFalse();
    });

    it("should detect segment behavior", () => {
      expect(component.hasBehavior("segment")).toBeTrue();
      fixture.componentRef.setInput("config", {
        name: "No Segments",
        gates: [{ laneIndex: 0, gateType: 0 }],
      } as any);
      fixture.detectChanges();
      expect(component.hasBehavior("segment")).toBeFalse();
    });

    it("should detect pit_in behavior", () => {
      expect(component.hasBehavior("pit_in")).toBeTrue();
      fixture.componentRef.setInput("config", {
        name: "No Pit In",
        gates: [{ laneIndex: 0, gateType: 0 }],
      } as any);
      fixture.detectChanges();
      expect(component.hasBehavior("pit_in")).toBeFalse();
    });

    it("should detect pit_out behavior", () => {
      expect(component.hasBehavior("pit_out")).toBeTrue();
      fixture.componentRef.setInput("config", {
        name: "No Pit Out",
        gates: [{ laneIndex: 0, gateType: 0 }],
      } as any);
      fixture.detectChanges();
      expect(component.hasBehavior("pit_out")).toBeFalse();
    });

    it("should return false for unknown behavior", () => {
      expect(component.hasBehavior("unknown" as any)).toBeFalse();
    });
  });
});
