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

  it("should apply line.backgroundColor as style.--line-color to driver-group when rendered", () => {
    const mockDriverLines: DriverLine[] = [
      {
        objectId: "d1",
        driverName: "Driver 1",
        color: "#FFFFFF",
        backgroundColor: "#FF0000",
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
    expect(rankGroup.style.getPropertyValue("--line-color")).toBe("#FF0000");

    const lapGroup = driverGroups[1].nativeElement;
    expect(lapGroup.style.getPropertyValue("--line-color")).toBe("#FF0000");
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
});
