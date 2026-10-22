import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { DataService } from "../../../data.service";
import { IDemoConfig } from "../../../proto/antigravity";
import { DemoConfigModalComponent } from "./demo-config-modal.component";

@Pipe({ name: "translate", standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("DemoConfigModalComponent", () => {
  let component: DemoConfigModalComponent;
  let fixture: ComponentFixture<DemoConfigModalComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;

  const defaultConfig: IDemoConfig = {
    minLapTimeMs: 3000,
    maxLapTimeMs: 5000,
    minRefuelTimeMs: 5000,
    maxRefuelTimeMs: 10000,
    numSegments: 4,
    minLapsBetweenPits: 3,
    maxLapsBetweenPits: 5,
    minReactionTimeMs: 100,
    maxReactionTimeMs: 500,
    minPitEntryOffsetMs: 500,
    maxPitEntryOffsetMs: 1000,
  };

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "getDefaultDemoConfig",
    ]);
    mockDataService.getDefaultDemoConfig.and.returnValue(defaultConfig);

    await TestBed.configureTestingModule({
      imports: [DemoConfigModalComponent, MockTranslatePipe],
      providers: [{ provide: DataService, useValue: mockDataService }],
    }).compileComponents();

    fixture = TestBed.createComponent(DemoConfigModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load default config on init", () => {
    expect(component.uiConfig.minLapTime).toBe(3); // 3000ms / 1000
    expect(component.uiConfig.maxLapTime).toBe(5);
    expect(component.uiConfig.numSegments).toBe(4);
  });

  it("should convert back to ms on confirm", () => {
    spyOn(component.confirm, "emit");
    component.uiConfig.minLapTime = 1.5;
    component.uiConfig.maxLapTime = 2.5;
    component.uiConfig.minRefuelTime = 4.0;
    component.uiConfig.maxRefuelTime = 8.0;
    component.uiConfig.numSegments = 6;
    component.uiConfig.minLapsBetweenPits = 2;
    component.uiConfig.maxLapsBetweenPits = 4;
    component.uiConfig.minReactionTime = 0.2;
    component.uiConfig.maxReactionTime = 0.6;
    component.uiConfig.minPitEntryOffset = 0.3;
    component.uiConfig.maxPitEntryOffset = 0.7;

    component.onConfirm();

    expect(component.confirm.emit).toHaveBeenCalledWith({
      minLapTimeMs: 1500,
      maxLapTimeMs: 2500,
      minRefuelTimeMs: 4000,
      maxRefuelTimeMs: 8000,
      numSegments: 6,
      minLapsBetweenPits: 2,
      maxLapsBetweenPits: 4,
      minReactionTimeMs: 200,
      maxReactionTimeMs: 600,
      minPitEntryOffsetMs: 300,
      maxPitEntryOffsetMs: 700,
    });
  });

  it("should reset to default", () => {
    component.uiConfig.minLapTime = 10;
    component.onReset();
    expect(component.uiConfig.minLapTime).toBe(3);
    expect(mockDataService.getDefaultDemoConfig).toHaveBeenCalled();
  });

  it("should use initialConfig if provided", () => {
    const initialConfig: IDemoConfig = {
      ...defaultConfig,
      minLapTimeMs: 1234,
    };
    fixture.componentRef.setInput("initialConfig", initialConfig);
    component.resetToInitial();
    expect(component.uiConfig.minLapTime).toBe(1.234);
  });

  it("should configure all time inputs with a step attribute of 0.5 seconds", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();

    const groups = fixture.nativeElement.querySelectorAll(".config-group");
    expect(groups.length).toBe(11);

    const timeFieldLabels = [
      "RDS_DEMO_MIN_LAP_TIME",
      "RDS_DEMO_MAX_LAP_TIME",
      "RDS_DEMO_MIN_REFUEL_TIME",
      "RDS_DEMO_MAX_REFUEL_TIME",
      "RDS_DEMO_MIN_REACTION_TIME",
      "RDS_DEMO_MAX_REACTION_TIME",
      "RDS_DEMO_MIN_PIT_ENTRY_OFFSET",
      "RDS_DEMO_MAX_PIT_ENTRY_OFFSET",
    ];

    const nonTimeFieldLabels = [
      "RDS_DEMO_NUM_SEGMENTS",
      "RDS_DEMO_MIN_LAPS_BETWEEN_PITS",
      "RDS_DEMO_MAX_LAPS_BETWEEN_PITS",
    ];

    groups.forEach((group: HTMLElement) => {
      const label = group.querySelector("label")?.textContent?.trim();
      const input = group.querySelector("input");
      expect(input).toBeTruthy();

      if (timeFieldLabels.includes(label || "")) {
        expect(input?.getAttribute("step")).toBe("0.5");
      } else if (nonTimeFieldLabels.includes(label || "")) {
        expect(input?.getAttribute("step")).toBeNull();
      }
    });
  });

  it("should convert 0.5s incremented values to milliseconds accurately on confirm", () => {
    spyOn(component.confirm, "emit");
    component.uiConfig.minLapTime = 3.5;
    component.uiConfig.maxLapTime = 5.5;
    component.uiConfig.minRefuelTime = 4.5;
    component.uiConfig.maxRefuelTime = 9.5;
    component.uiConfig.numSegments = 4;
    component.uiConfig.minLapsBetweenPits = 3;
    component.uiConfig.maxLapsBetweenPits = 5;
    component.uiConfig.minReactionTime = 0.5;
    component.uiConfig.maxReactionTime = 1.0;
    component.uiConfig.minPitEntryOffset = 1.5;
    component.uiConfig.maxPitEntryOffset = 2.0;

    component.onConfirm();

    expect(component.confirm.emit).toHaveBeenCalledWith({
      minLapTimeMs: 3500,
      maxLapTimeMs: 5500,
      minRefuelTimeMs: 4500,
      maxRefuelTimeMs: 9500,
      numSegments: 4,
      minLapsBetweenPits: 3,
      maxLapsBetweenPits: 5,
      minReactionTimeMs: 500,
      maxReactionTimeMs: 1000,
      minPitEntryOffsetMs: 1500,
      maxPitEntryOffsetMs: 2000,
    });
  });
});
