import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Pipe, PipeTransform } from "@angular/core";
import { ColumnPreviewComponent } from "./column-preview.component";
import { AnchorPoint } from "@app/components/raceday/column_definition";
import { ColumnVisibility } from "@app/models/settings";

@Pipe({ name: "translate", standalone: true })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("ColumnPreviewComponent", () => {
  let component: ColumnPreviewComponent;
  let fixture: ComponentFixture<ColumnPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ColumnPreviewComponent,
        MockTranslatePipe,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ColumnPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("getLabel", () => {
    it("should return empty string for undefined prop", () => {
      expect(component.getLabel(undefined)).toBe("");
    });

    it("should return correct label for static known columns", () => {
      expect(component.getLabel("lapCount")).toBe("RD_COL_LAP");
      expect(component.getLabel("driver.name")).toBe("RD_COL_NAME");
    });

    it("should resolve imageset_fuel-gauge-builtin to RD_COL_FUEL_GAUGE", () => {
      expect(component.getLabel("imageset_fuel-gauge-builtin")).toBe("RD_COL_FUEL_GAUGE");
    });

    it("should find custom imagesets in columnSlots", () => {
      fixture.componentRef.setInput("columnSlots", [
        { key: "imageset_my-set", label: "My Custom Set" }
      ]);
      fixture.detectChanges();
      expect(component.getLabel("imageset_my-set")).toBe("My Custom Set");
    });

    it("should match custom imagesets with index suffixes in columnSlots", () => {
      fixture.componentRef.setInput("columnSlots", [
        { key: "imageset_my-set", label: "My Custom Set" }
      ]);
      fixture.detectChanges();
      expect(component.getLabel("imageset_my-set_1")).toBe("My Custom Set");
    });

    it("should strip imageset_ prefix if not found in columnSlots", () => {
      fixture.componentRef.setInput("columnSlots", []);
      fixture.detectChanges();
      expect(component.getLabel("imageset_unloaded-set")).toBe("unloaded-set");
    });
  });

  describe("getColumnLabel", () => {
    it("should return translated label of CenterCenter property if active", () => {
      fixture.componentRef.setInput("columnLayouts", {
        slot1: { [AnchorPoint.CenterCenter]: "lapCount" }
      });
      fixture.detectChanges();
      expect(component.getColumnLabel("slot1")).toBe("RD_COL_LAP");
    });

    it("should fallback to slot label if CenterCenter is empty", () => {
      fixture.componentRef.setInput("columnSlots", [
        { key: "slot1", label: "Fallback Slot Label" }
      ]);
      fixture.componentRef.setInput("columnLayouts", {
        slot1: { [AnchorPoint.TopLeft]: "lapCount" }
      });
      fixture.detectChanges();
      expect(component.getColumnLabel("slot1")).toBe("Fallback Slot Label");
    });
  });

  describe("getAnchorValue", () => {
    it("should return anchor value if configured in layout", () => {
      fixture.componentRef.setInput("columnLayouts", {
        slot1: { [AnchorPoint.TopLeft]: "reactionTime" }
      });
      fixture.detectChanges();
      expect(component.getAnchorValue("slot1", AnchorPoint.TopLeft)).toBe("reactionTime");
    });

    it("should default CenterCenter to slotKey if no layout exists at all", () => {
      fixture.componentRef.setInput("columnLayouts", {});
      fixture.detectChanges();
      expect(component.getAnchorValue("slot1", AnchorPoint.CenterCenter)).toBe("slot1");
    });

    it("should return undefined for CenterCenter if layout exists but CenterCenter is not defined", () => {
      fixture.componentRef.setInput("columnLayouts", {
        slot1: { [AnchorPoint.TopLeft]: "reactionTime" }
      });
      fixture.detectChanges();
      expect(component.getAnchorValue("slot1", AnchorPoint.CenterCenter)).toBeUndefined();
    });
  });

  describe("isOptional", () => {
    it("should return true if columnVisibility is not Always", () => {
      fixture.componentRef.setInput("columnVisibility", {
        slot1: ColumnVisibility.FuelRaceOnly
      });
      fixture.detectChanges();
      expect(component.isOptional("slot1")).toBeTrue();
    });

    it("should return false if columnVisibility is Always", () => {
      fixture.componentRef.setInput("columnVisibility", {
        slot1: ColumnVisibility.Always
      });
      fixture.detectChanges();
      expect(component.isOptional("slot1")).toBeFalse();
    });
  });
});
