import { ComponentRef } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PdfExportDialogComponent } from "./pdf-export-dialog.component";

describe("PdfExportDialogComponent", () => {
  let component: PdfExportDialogComponent;
  let fixture: ComponentFixture<PdfExportDialogComponent>;
  let componentRef: ComponentRef<PdfExportDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PdfExportDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PdfExportDialogComponent);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should not display modal when visible is false", () => {
    componentRef.setInput("visible", false);
    fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector(".modal-backdrop");
    expect(modal).toBeNull();
  });

  it("should display modal when visible is true", () => {
    componentRef.setInput("visible", true);
    fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector(".modal-backdrop");
    expect(modal).not.toBeNull();
  });

  it("should emit cancel when onCancel is called", () => {
    spyOn(component.cancel, "emit");
    component.onCancel();
    expect(component.cancel.emit).toHaveBeenCalled();
  });

  it("should emit confirm with options when onExport is called", () => {
    spyOn(component.confirm, "emit");
    component.includeBackground = false;
    component.saveAsDefault = true;
    component.onExport();
    expect(component.confirm.emit).toHaveBeenCalledWith({
      includeBackground: false,
      saveAsDefault: true,
    });
  });
});
