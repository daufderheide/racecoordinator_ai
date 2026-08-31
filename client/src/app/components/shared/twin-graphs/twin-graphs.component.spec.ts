import { Pipe, PipeTransform } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";

import { DriverLine, TwinGraphsComponent } from "./twin-graphs.component";

@Pipe({ name: "translate", standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("TwinGraphsComponent", () => {
  let component: TwinGraphsComponent;
  let fixture: ComponentFixture<TwinGraphsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TwinGraphsComponent, MockTranslatePipe],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TwinGraphsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should apply line.color as style.--line-color to driver-group when rendered", () => {
    const mockDriverLines: DriverLine[] = [
      {
        objectId: "d1",
        driverName: "Driver 1",
        color: "#00FFFF",
        backgroundColor: "#0B2E30",
        points: [{ x: 1, y: 1 }],
        pathData: "",
        rankPoints: [{ x: 1, y: 1 }],
        rankPathData: "",
        legendX: 0,
        legendY: 0,
      },
    ];

    component.driverLines = mockDriverLines;
    component.ngOnChanges({
      driverLines: {
        currentValue: mockDriverLines,
        previousValue: undefined,
        firstChange: true,
        isFirstChange: () => true,
      },
    } as any);

    fixture.detectChanges();

    const driverGroups = fixture.debugElement.queryAll(By.css(".driver-group"));
    // There are 2 driver groups per driver (rankings graph, laps graph)
    expect(driverGroups.length).toBe(2);

    // Verify style.--line-color is bound to color
    const rankGroup = driverGroups[0].nativeElement;
    expect(rankGroup.style.getPropertyValue("--line-color")).toBe("#00FFFF");

    const lapGroup = driverGroups[1].nativeElement;
    expect(lapGroup.style.getPropertyValue("--line-color")).toBe("#00FFFF");
  });

  describe("Driver Visibility Logic", () => {
    beforeEach(() => {
      component.hiddenDriverIds.clear();
      component.hoveredDriverId = null;
      component.driverLines = [
        { objectId: "d1" } as any,
        { objectId: "d2" } as any,
        { objectId: "d3" } as any,
      ];
    });

    it("should have all drivers visible by default", () => {
      expect(component.isDriverVisible("d1")).toBeTrue();
      expect(component.isDriverVisible("d2")).toBeTrue();
    });

    it("should toggle driver visibility via onLegendClick", () => {
      component.onLegendClick("d2");
      expect(component.isDriverVisible("d2")).toBeFalse();
      expect(component.isDriverVisible("d1")).toBeTrue();

      component.onLegendClick("d2");
      expect(component.isDriverVisible("d2")).toBeTrue();
    });

    it("should show only one driver onLegendDblClick", () => {
      component.onLegendDblClick("d2");
      expect(component.isDriverVisible("d1")).toBeFalse();
      expect(component.isDriverVisible("d2")).toBeTrue();
      expect(component.isDriverVisible("d3")).toBeFalse();
    });

    it("should show all drivers when onLegendDblClick called on already-solo driver", () => {
      component.onLegendDblClick("d2");
      expect(component.isDriverVisible("d1")).toBeFalse();

      component.onLegendDblClick("d2");
      expect(component.isDriverVisible("d1")).toBeTrue();
      expect(component.isDriverVisible("d2")).toBeTrue();
    });
  });

  describe("Stacked Graph Mode", () => {
    it("should calculate full width scaling and separate top/bottom legend positions when stacked is true", () => {
      component.stacked = true;
      component.width = 1400;
      component.padding = { top: 80, right: 100, bottom: 150, left: 100 };
      component.maxX = 10;

      const mockDriverLines: DriverLine[] = [
        {
          objectId: "d1",
          driverName: "Driver 1",
          color: "#FFFFFF",
          backgroundColor: "#FF0000",
          points: [{ x: 5, y: 3 }],
          pathData: "",
          rankPoints: [{ x: 5, y: 1 }],
          rankPathData: "",
        },
      ];

      component.driverLines = mockDriverLines;
      component.ngOnChanges({
        stacked: {
          currentValue: true,
          previousValue: false,
          firstChange: false,
          isFirstChange: () => false,
        },
      } as any);

      // In stacked mode, graph width is width - left - right = 1400 - 100 - 100 = 1200
      // scaleXLeft(5) = 100 + (5 / 10) * 1200 = 700
      expect(component["scaleXLeft"](5)).toBe(700);
      expect(component["scaleXRight"](5)).toBe(700);

      // Verify top and bottom legend coordinates are calculated
      expect(mockDriverLines[0].topLegendY).toBeDefined();
      expect(mockDriverLines[0].bottomLegendY).toBeDefined();
      expect(mockDriverLines[0].topLegendY!).toBeLessThan(
        mockDriverLines[0].bottomLegendY!,
      );

      // Verify legend Y start is placed below the X-axis title (topGraphBottom + 55) to prevent overlap
      expect(component.topLegendYStart).toBeGreaterThan(
        component.topGraphBottom + 55,
      );
      expect(component.bottomLegendYStart).toBeGreaterThan(
        component.bottomGraphBottom + 55,
      );
    });
  });
});
