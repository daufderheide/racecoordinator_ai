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
});
