import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { DataService } from "@app/data.service";
import { DriverLabel } from "@app/models/driver-label";
import { TranslationService } from "@app/services/translation.service";

import { DriverLabelManagerModalComponent } from "./driver-label-manager-modal.component";

describe("DriverLabelManagerModalComponent", () => {
  let component: DriverLabelManagerModalComponent;
  let fixture: ComponentFixture<DriverLabelManagerModalComponent>;
  let mockDataService: any;
  let mockTranslationService: any;

  const mockLabels: DriverLabel[] = [
    { entity_id: "lbl-1", name: "Pro", color: "#ef4444" },
    { entity_id: "lbl-2", name: "Rookie", color: "#3b82f6" },
    { entity_id: "lbl-3", name: "Vintage", color: "#10b981" },
  ];

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "createDriverLabel",
      "updateDriverLabel",
      "deleteDriverLabel",
    ]);
    mockDataService.createDriverLabel.and.callFake((payload: DriverLabel) =>
      of({ ...payload, entity_id: "lbl-new-id" }),
    );
    mockDataService.updateDriverLabel.and.callFake((payload: DriverLabel) =>
      of(payload),
    );
    mockDataService.deleteDriverLabel.and.returnValue(of(undefined));

    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake(
      (key: string, params?: any) =>
        params?.name ? `${key}:${params.name}` : key,
    );

    await TestBed.configureTestingModule({
      imports: [DriverLabelManagerModalComponent],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverLabelManagerModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("allLabels", [...mockLabels]);
    fixture.componentRef.setInput("assignedLabelIds", ["lbl-1"]);
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();
  });

  it("should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("should filter labels by search query", () => {
    component.searchQuery = "rook";
    expect(component.filteredLabels.length).toBe(1);
    expect(component.filteredLabels[0].name).toBe("Rookie");

    component.searchQuery = "  ";
    expect(component.filteredLabels.length).toBe(3);
  });

  it("should toggle assignment of labels correctly", () => {
    spyOn(component.assignedLabelIdsChange, "emit");

    // Toggle already assigned label (lbl-1) -> removes it
    component.toggleAssign(mockLabels[0]);
    expect(component.currentAssignedIds).toEqual([]);
    expect(component.assignedLabelIdsChange.emit).toHaveBeenCalledWith([]);

    // Toggle unassigned label (lbl-2) -> adds it
    component.toggleAssign(mockLabels[1]);
    expect(component.currentAssignedIds).toEqual(["lbl-2"]);
    expect(component.assignedLabelIdsChange.emit).toHaveBeenCalledWith([
      "lbl-2",
    ]);
  });

  it("should open create form with randomized color and empty name", () => {
    component.openCreateForm();
    expect(component.isFormOpen).toBeTrue();
    expect(component.editingLabelId).toBeNull();
    expect(component.formName).toBe("");
    expect(component.formColor).toBeTruthy();
    expect(component.formErrorMessage).toBe("");
  });

  it("should validate empty name on saveForm", () => {
    component.openCreateForm();
    component.formName = "   ";
    component.saveForm();

    expect(component.formErrorMessage).toBe("DLM_ERR_NAME_REQUIRED");
    expect(mockDataService.createDriverLabel).not.toHaveBeenCalled();
  });

  it("should validate duplicate name on saveForm", () => {
    component.openCreateForm();
    component.formName = "pro"; // case-insensitive duplicate of "Pro"
    component.saveForm();

    expect(component.formErrorMessage).toBe("DLM_ERR_NAME_EXISTS");
    expect(mockDataService.createDriverLabel).not.toHaveBeenCalled();
  });

  it("should create label and auto-assign it", () => {
    spyOn(component.labelsUpdated, "emit");
    spyOn(component.assignedLabelIdsChange, "emit");

    component.openCreateForm();
    component.formName = "Super Pro";
    component.formColor = "#f59e0b";
    component.saveForm();

    expect(mockDataService.createDriverLabel).toHaveBeenCalledWith({
      entity_id: "new",
      name: "Super Pro",
      color: "#f59e0b",
    });
    expect(component.isFormOpen).toBeFalse();
    expect(component.currentLabels.length).toBe(4);
    expect(component.currentAssignedIds).toContain("lbl-new-id");
    expect(component.labelsUpdated.emit).toHaveBeenCalled();
    expect(component.assignedLabelIdsChange.emit).toHaveBeenCalledWith([
      "lbl-1",
      "lbl-new-id",
    ]);
  });

  it("should handle error when create label fails", () => {
    mockDataService.createDriverLabel.and.returnValue(
      throwError(() => new Error("Creation error")),
    );
    component.openCreateForm();
    component.formName = "Elite";
    component.saveForm();

    expect(component.isSaving).toBeFalse();
    expect(component.formErrorMessage).toBe("COMMON_ERROR");
  });

  it("should open edit form with existing label data", () => {
    component.openEditForm(mockLabels[0]);
    expect(component.isFormOpen).toBeTrue();
    expect(component.editingLabelId).toBe("lbl-1");
    expect(component.formName).toBe("Pro");
    expect(component.formColor).toBe("#ef4444");
  });

  it("should update existing label on saveForm", () => {
    spyOn(component.labelsUpdated, "emit");

    component.openEditForm(mockLabels[0]);
    component.formName = "Pro Driver";
    component.formColor = "#ec4899";
    component.saveForm();

    expect(mockDataService.updateDriverLabel).toHaveBeenCalledWith({
      entity_id: "lbl-1",
      name: "Pro Driver",
      color: "#ec4899",
    });
    expect(component.isFormOpen).toBeFalse();
    expect(
      component.currentLabels.find((l) => l.entity_id === "lbl-1")?.name,
    ).toBe("Pro Driver");
    expect(component.labelsUpdated.emit).toHaveBeenCalled();
  });

  it("should handle error when update label fails", () => {
    mockDataService.updateDriverLabel.and.returnValue(
      throwError(() => new Error("Update error")),
    );
    component.openEditForm(mockLabels[0]);
    component.formName = "Updated Pro";
    component.saveForm();

    expect(component.isSaving).toBeFalse();
    expect(component.formErrorMessage).toBe("COMMON_ERROR");
  });

  it("should select color swatch and randomize color", () => {
    component.selectColor("#06b6d4");
    expect(component.formColor).toBe("#06b6d4");

    component.randomizeColor();
    expect(component.formColor).toBeTruthy();
  });

  it("should cancel form correctly", () => {
    component.openCreateForm();
    component.formName = "Temp";
    component.cancelForm();
    expect(component.isFormOpen).toBeFalse();
    expect(component.editingLabelId).toBeNull();
  });

  it("should handle delete confirmation, cancel, and execute", () => {
    spyOn(component.labelsUpdated, "emit");
    spyOn(component.assignedLabelIdsChange, "emit");

    // Confirm delete
    component.confirmDelete(mockLabels[0]);
    expect(component.deletingLabelId).toBe("lbl-1");

    // Cancel delete
    component.cancelDelete();
    expect(component.deletingLabelId).toBeNull();

    // Re-confirm and execute delete
    component.confirmDelete(mockLabels[0]);
    component.executeDelete(mockLabels[0]);

    expect(mockDataService.deleteDriverLabel).toHaveBeenCalledWith("lbl-1");
    expect(
      component.currentLabels.find((l) => l.entity_id === "lbl-1"),
    ).toBeUndefined();
    expect(component.currentAssignedIds.includes("lbl-1")).toBeFalse();
    expect(component.labelsUpdated.emit).toHaveBeenCalled();
    expect(component.assignedLabelIdsChange.emit).toHaveBeenCalledWith([]);
  });

  it("should handle escape key to dismiss delete confirm, form, or modal", () => {
    spyOn(component.close, "emit");
    spyOn(component.visibleChange, "emit");

    // 1. With delete confirmation open
    component.deletingLabelId = "lbl-1";
    component.onEscape();
    expect(component.deletingLabelId).toBeNull();
    expect(component.isFormOpen).toBeFalse();
    expect(component.close.emit).not.toHaveBeenCalled();

    // 2. With form open
    component.openCreateForm();
    component.onEscape();
    expect(component.isFormOpen).toBeFalse();
    expect(component.close.emit).not.toHaveBeenCalled();

    // 3. Normal modal open
    component.onEscape();
    expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    expect(component.close.emit).toHaveBeenCalled();
  });

  it("should close modal on onClose()", () => {
    spyOn(component.close, "emit");
    spyOn(component.visibleChange, "emit");

    component.onClose();
    expect(component.visibleChange.emit).toHaveBeenCalledWith(false);
    expect(component.close.emit).toHaveBeenCalled();
  });
});
