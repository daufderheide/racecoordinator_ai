// Force refresh for unit tests
import { CdkDragDrop, DragDropModule } from "@angular/cdk/drag-drop";
import {
  ChangeDetectorRef,
  Component,
  input,
  Pipe,
  PipeTransform,
} from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import {} from "rxjs";

import { ColumnVisibility, Settings } from "../../../models/settings";
import { TranslationService } from "../../../services/translation.service";
import { AnchorPoint } from "../../raceday/column_definition";
import {
  ReorderDialogComponent,
  ReorderDialogData,
} from "./reorder-dialog.component";

@Pipe({ name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Component({
  selector: "app-column-preview",
  standalone: true,
  template: "",
  imports: [DragDropModule],
})
class MockColumnPreviewComponent {
  columnSlots = input<any[]>([]);
  columnLayouts = input<any>({});
}

describe("ReorderDialogComponent", () => {
  let component: ReorderDialogComponent;
  let fixture: ComponentFixture<ReorderDialogComponent>;
  let mockTranslationService: jasmine.SpyObj<TranslationService>;

  const mockData: ReorderDialogData = {
    availableValues: [
      { key: "lapCount", label: "RD_COL_LAP" },
      { key: "driver.name", label: "RD_COL_NAME" },
    ],
    columnSlots: [{ key: "slot1", label: "RD_COL_NAME" }],
    columnLayouts: {
      slot1: { [AnchorPoint.CenterCenter]: "driver.name" },
    },
    columnVisibility: {
      slot1: ColumnVisibility.Always,
    },
    screenName: "Test Screen",
  };

  beforeEach(async () => {
    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake((key) => key);

    await TestBed.configureTestingModule({
      imports: [
        DragDropModule,
        ReorderDialogComponent,
        MockTranslatePipe,
        MockColumnPreviewComponent,
      ],
      providers: [
        { provide: TranslationService, useValue: mockTranslationService },
        ChangeDetectorRef,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReorderDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize data and alphabetize available values", () => {
    fixture.componentRef.setInput("data", mockData);
    fixture.detectChanges();
    expect(component.availableValues.length).toBe(2);
    // driver.name (RD_COL_NAME) should come after lapCount (RD_COL_LAP) because R comes after L? No, RD_COL_LAP comes before RD_COL_NAME.
    // Wait, "RD_COL_LAP" vs "RD_COL_NAME". alphabetically "L" comes before "N".
    expect(component.availableValues[0].key).toBe("lapCount");
    expect(component.availableValues[1].key).toBe("driver.name");

    // Test reverse to be sure
    fixture.componentRef.setInput("data", {
      ...mockData,
      availableValues: [
        { key: "z", label: "Z" },
        { key: "a", label: "A" },
      ],
    });
    fixture.detectChanges();
    fixture.detectChanges();
    expect(component.availableValues[0].key).toBe("a");
    expect(component.availableValues[1].key).toBe("z");
  });

  it("should handle drop column (reorder)", () => {
    fixture.componentRef.setInput("data", {
      ...mockData,
      columnSlots: [
        { key: "s1", label: "L1" },
        { key: "s2", label: "L2" },
      ],
    });
    fixture.detectChanges();
    fixture.detectChanges();
    const event = {
      previousIndex: 0,
      currentIndex: 1,
    } as CdkDragDrop<string[]>;

    component.dropColumn(event);
    expect(component.columnSlots[0].key).toBe("s2");
    expect(component.columnSlots[1].key).toBe("s1");
  });

  it("should handle value drop on anchor", () => {
    fixture.componentRef.setInput("data", mockData);
    fixture.detectChanges();
    component.onValueDrop("slot1", AnchorPoint.TopLeft, "lapCount");
    expect(component.columnLayouts["slot1"]![AnchorPoint.TopLeft]).toBe(
      "lapCount",
    );
  });

  it("should clear anchor", () => {
    fixture.componentRef.setInput("data", mockData);
    fixture.detectChanges();
    component.onValueDrop("slot1", AnchorPoint.TopLeft, "lapCount");
    expect(component.columnLayouts["slot1"]![AnchorPoint.TopLeft]).toBe(
      "lapCount",
    );

    component.clearAnchor("slot1", AnchorPoint.TopLeft);
    expect(
      component.columnLayouts["slot1"]![AnchorPoint.TopLeft],
    ).toBeUndefined();
  });

  it("should remove column", () => {
    fixture.componentRef.setInput("data", mockData);
    fixture.detectChanges();
    expect(component.columnSlots.length).toBe(1);
    component.removeColumn("slot1");
    expect(component.columnSlots.length).toBe(0);
    expect(component.columnLayouts["slot1"]).toBeUndefined();
  });

  it("should handle add column drop", () => {
    fixture.componentRef.setInput("data", mockData);
    fixture.detectChanges();
    const event = {
      item: { data: "lapCount" },
    } as CdkDragDrop<any>;

    component.onAddColumnDrop(event);
    expect(component.columnSlots.length).toBe(2);
    expect(component.columnSlots[1].key).toBe("lapCount"); // Since slot1 exists
    expect(component.columnLayouts["lapCount"]).toEqual({
      [AnchorPoint.CenterCenter]: "lapCount",
    });
  });

  it("should handle add column drop with duplicate keys", () => {
    fixture.componentRef.setInput("data", {
      ...mockData,
      columnSlots: [{ key: "lapCount", label: "L" }],
    });
    fixture.detectChanges();
    const event = {
      item: { data: "lapCount" },
    } as CdkDragDrop<any>;

    component.onAddColumnDrop(event);
    expect(component.columnSlots.length).toBe(2);
    expect(component.columnSlots[1].key).toBe("lapCount_1");
    expect(component.columnVisibility["lapCount_1"]).toBe(
      ColumnVisibility.Always,
    );
  });

  it("should emit save on onSave", () => {
    spyOn(component.save, "emit");
    fixture.componentRef.setInput("data", mockData);
    fixture.detectChanges();
    component.onSave();
    expect(component.save.emit).toHaveBeenCalledWith({
      columns: ["slot1"],
      columnLayouts: mockData.columnLayouts,
      columnVisibility: mockData.columnVisibility,
    });
  });

  it("should initialize visibility if missing", () => {
    fixture.componentRef.setInput("data", {
      ...mockData,
      columnVisibility: {},
    });
    fixture.detectChanges();
    expect(component.columnVisibility["slot1"]).toBe(ColumnVisibility.Always);
  });

  it("should handle visibility changes", () => {
    fixture.componentRef.setInput("data", mockData);
    fixture.detectChanges();
    component.columnVisibility["slot1"] = ColumnVisibility.FuelRaceOnly;
    // Template would handle this via ngModel, but we check the state
    expect(component.columnVisibility["slot1"]).toBe(
      ColumnVisibility.FuelRaceOnly,
    );
  });

  it("should handle remove column and delete its visibility", () => {
    fixture.componentRef.setInput("data", mockData);
    fixture.detectChanges();
    expect(component.columnVisibility["slot1"]).toBeDefined();
    component.removeColumn("slot1");
    expect(component.columnVisibility["slot1"]).toBeUndefined();
  });

  it("should emit cancel on onCancel", () => {
    spyOn(component.cancel, "emit");
    component.onCancel();
    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it("should reset to defaults when onReset is called", () => {
    // 1. Initialize with some non-default data
    fixture.componentRef.setInput("data", {
      availableValues: [
        { key: "lapCount", label: "L" },
        { key: "driver.nickname", label: "N" },
        { key: "lastLapTime", label: "T" },
        { key: "gapLeader", label: "G" },
        { key: "imageset_fuel-gauge-builtin", label: "F" },
      ],
      columnSlots: [{ key: "custom_slot", label: "Custom" }],
      columnLayouts: { custom_slot: { [AnchorPoint.TopLeft]: "lapCount" } },
      columnVisibility: { custom_slot: ColumnVisibility.NonFuelRaceOnly },
      screenName: "Reset Test",
    });
    fixture.detectChanges();

    expect(component.columnSlots.length).toBe(1);
    expect(component.columnSlots[0].key).toBe("custom_slot");

    // 2. Call reset
    component.onReset();

    // 3. Verify it matches DEFAULT_COLUMNS and Settings defaults
    expect(component.columnSlots.length).toBe(Settings.DEFAULT_COLUMNS.length);
    expect(component.columnSlots[0].key).toBe("driver.nickname");
    expect(component.columnSlots[1].key).toBe("imageset_fuel-gauge-builtin");
    expect(component.columnSlots[2].key).toBe("lapCount");

    // Verify layout reset (from new Settings())
    expect(component.columnLayouts["driver.nickname"]).toEqual({
      [AnchorPoint.CenterCenter]: "driver.nickname",
      [AnchorPoint.BottomRight]: "participant.team.name",
    });
    expect(component.columnLayouts["custom_slot"]).toBeUndefined();

    // Verify visibility reset
    expect(component.columnVisibility["imageset_fuel-gauge-builtin"]).toBe(
      ColumnVisibility.FuelRaceOnly,
    );
    expect(component.columnVisibility["custom_slot"]).toBeUndefined();
  });

  describe("reindexAllSegments", () => {
    it("should reset segment indices per column", () => {
      fixture.componentRef.setInput("data", {
        ...mockData,
        columnSlots: [
          { key: "col1", label: "C1" },
          { key: "col2", label: "C2" },
        ],
        columnLayouts: {
          col1: {
            [AnchorPoint.TopLeft]: "segmentTime_3",
            [AnchorPoint.TopRight]: "segmentTime_9",
          },
          col2: {
            [AnchorPoint.BottomLeft]: "segmentTime_5",
          },
        },
      });
      fixture.detectChanges();

      (component as any).reindexAllSegments();

      // col1 should have segmentTime and segmentTime_1
      expect(component.columnLayouts["col1"]![AnchorPoint.TopLeft]).toBe(
        "segmentTime",
      );
      expect(component.columnLayouts["col1"]![AnchorPoint.TopRight]).toBe(
        "segmentTime_1",
      );

      // col2 should have segmentTime
      expect(component.columnLayouts["col2"]![AnchorPoint.BottomLeft]).toBe(
        "segmentTime",
      );
    });

    it("should preserve non-segment properties during re-indexing", () => {
      fixture.componentRef.setInput("data", {
        ...mockData,
        columnSlots: [{ key: "col1", label: "C1" }],
        columnLayouts: {
          col1: {
            [AnchorPoint.CenterCenter]: "lapCount",
            [AnchorPoint.TopLeft]: "segmentTime_2",
          },
        },
      });
      fixture.detectChanges();

      (component as any).reindexAllSegments();

      expect(component.columnLayouts["col1"]![AnchorPoint.CenterCenter]).toBe(
        "lapCount",
      );
      expect(component.columnLayouts["col1"]![AnchorPoint.TopLeft]).toBe(
        "segmentTime",
      );
    });
  });

  describe("last value protection", () => {
    it("should show confirmation when clearing the last value in a slot", () => {
      fixture.componentRef.setInput("data", {
        ...mockData,
        columnLayouts: {
          slot1: { [AnchorPoint.CenterCenter]: "driver.name" },
        },
      });
      fixture.detectChanges();

      component.clearAnchor("slot1", AnchorPoint.CenterCenter);

      expect(component.showLastValueConfirm).toBeTrue();
      expect(component.pendingLastValueClear).toEqual({
        slotKey: "slot1",
        anchor: AnchorPoint.CenterCenter,
      });
      // The value should NOT be cleared yet
      expect(component.columnLayouts["slot1"]![AnchorPoint.CenterCenter]).toBe(
        "driver.name",
      );
    });

    it("should clear normally when there are multiple values in the slot", () => {
      fixture.componentRef.setInput("data", {
        ...mockData,
        columnLayouts: {
          slot1: {
            [AnchorPoint.CenterCenter]: "driver.name",
            [AnchorPoint.TopLeft]: "lapCount",
          },
        },
      });
      fixture.detectChanges();

      component.clearAnchor("slot1", AnchorPoint.CenterCenter);

      expect(component.showLastValueConfirm).toBeFalse();
      expect(component.pendingLastValueClear).toBeNull();
      // The value should be cleared immediately
      expect(
        component.columnLayouts["slot1"]![AnchorPoint.CenterCenter],
      ).toBeUndefined();
      expect(component.columnLayouts["slot1"]![AnchorPoint.TopLeft]).toBe(
        "lapCount",
      );
    });

    it("should remove column when confirming last value clear", () => {
      fixture.componentRef.setInput("data", {
        ...mockData,
        columnSlots: [{ key: "slot1", label: "Slot 1" }],
        columnLayouts: {
          slot1: { [AnchorPoint.CenterCenter]: "driver.name" },
        },
      });
      fixture.detectChanges();

      // Trigger the confirmation
      component.clearAnchor("slot1", AnchorPoint.CenterCenter);
      expect(component.showLastValueConfirm).toBeTrue();

      // Confirm the clear
      component.onConfirmLastValueClear();

      expect(component.showLastValueConfirm).toBeFalse();
      expect(component.pendingLastValueClear).toBeNull();
      expect(component.columnLayouts["slot1"]).toBeUndefined();
      expect(component.columnSlots.length).toBe(0);
    });

    it("should not remove column when canceling last value clear", () => {
      fixture.componentRef.setInput("data", {
        ...mockData,
        columnSlots: [{ key: "slot1", label: "Slot 1" }],
        columnLayouts: {
          slot1: { [AnchorPoint.CenterCenter]: "driver.name" },
        },
      });
      fixture.detectChanges();

      // Trigger the confirmation
      component.clearAnchor("slot1", AnchorPoint.CenterCenter);
      expect(component.showLastValueConfirm).toBeTrue();

      // Cancel the clear
      component.onCancelLastValueClear();

      expect(component.showLastValueConfirm).toBeFalse();
      expect(component.pendingLastValueClear).toBeNull();
      // The value should still be there
      expect(component.columnLayouts["slot1"]![AnchorPoint.CenterCenter]).toBe(
        "driver.name",
      );
      expect(component.columnSlots.length).toBe(1);
    });
  });
});
