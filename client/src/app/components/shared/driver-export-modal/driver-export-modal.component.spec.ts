import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { DataService } from "@app/data.service";
import { TranslationService } from "@app/services/translation.service";

import { DriverExportModalComponent } from "./driver-export-modal.component";

describe("DriverExportModalComponent", () => {
  let component: DriverExportModalComponent;
  let fixture: ComponentFixture<DriverExportModalComponent>;
  let mockDataService: any;
  let mockTranslationService: any;
  let originalShowSaveFilePicker: any;
  let mockWritable: any;
  let mockHandle: any;

  beforeEach(async () => {
    originalShowSaveFilePicker = (window as any).showSaveFilePicker;
    mockWritable = {
      write: jasmine.createSpy("write").and.returnValue(Promise.resolve()),
      close: jasmine.createSpy("close").and.returnValue(Promise.resolve()),
    };
    mockHandle = {
      createWritable: jasmine
        .createSpy("createWritable")
        .and.returnValue(Promise.resolve(mockWritable)),
    };
    (window as any).showSaveFilePicker = jasmine
      .createSpy("showSaveFilePicker")
      .and.returnValue(Promise.resolve(mockHandle));

    mockDataService = jasmine.createSpyObj("DataService", ["exportDrivers"]);
    mockDataService.exportDrivers.and.returnValue(
      of(new Blob(["mock-zip-content"], { type: "application/zip" })),
    );

    mockTranslationService = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    mockTranslationService.translate.and.callFake(
      (key: string, params?: any) => {
        if (params?.count !== undefined) {
          return `${key}:${params.count}`;
        }
        return key;
      },
    );

    await TestBed.configureTestingModule({
      imports: [DriverExportModalComponent],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: TranslationService, useValue: mockTranslationService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverExportModalComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    (window as any).showSaveFilePicker = originalShowSaveFilePicker;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
    expect(component.selectedFormat).toBe("csv");
    expect(component.isExporting).toBeFalse();
  });

  it("should not render modal dialog when visible is false", () => {
    fixture.componentRef.setInput("visible", false);
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector(
      "#driver-export-modal-dialog",
    );
    expect(dialog).toBeNull();
  });

  it("should render modal dialog when visible is true", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("driverCount", 5);
    fixture.detectChanges();

    const dialog = fixture.nativeElement.querySelector(
      "#driver-export-modal-dialog",
    );
    expect(dialog).not.toBeNull();
  });

  it("should render overview card with translated driver count and info", () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("driverCount", 7);
    fixture.detectChanges();

    const countText = fixture.nativeElement.querySelector(".count-text");
    expect(countText?.textContent?.trim()).toBe("DEM_DRIVER_COUNT:7");

    const desc = fixture.nativeElement.querySelector(".export-description");
    expect(desc?.textContent?.trim()).toBe("DEM_EXPORT_INFO");

    const note = fixture.nativeElement.querySelector(".note-text");
    expect(note?.textContent?.trim()).toBe("DEM_SHARED_AUDIO_INFO");

    const formatTitle = fixture.nativeElement.querySelector(
      ".format-section-title",
    );
    expect(formatTitle?.textContent?.trim()).toBe("DEM_FORMAT_LABEL");
  });

  it("should allow selecting format", () => {
    component.selectFormat("xlsx");
    expect(component.selectedFormat).toBe("xlsx");

    component.selectFormat("json");
    expect(component.selectedFormat).toBe("json");

    component.selectFormat("csv");
    expect(component.selectedFormat).toBe("csv");
  });

  it("should emit close on onClose", () => {
    spyOn(component.close, "emit");
    component.onClose();
    expect(component.close.emit).toHaveBeenCalled();
  });

  it("should not close when isExporting is true", () => {
    spyOn(component.close, "emit");
    component.isExporting = true;
    component.onClose();
    expect(component.close.emit).not.toHaveBeenCalled();
  });

  it("should call dataService.exportDrivers and saveFileAs on onExport", async () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("driverCount", 3);
    component.selectedFormat = "xlsx";

    spyOn(component.exported, "emit");
    spyOn(component.close, "emit");

    await component.onExport();

    expect(mockDataService.exportDrivers).toHaveBeenCalledWith("xlsx");
    expect((window as any).showSaveFilePicker).toHaveBeenCalledWith(
      jasmine.objectContaining({
        suggestedName: "drivers_export.zip",
      }),
    );
    expect(mockWritable.write).toHaveBeenCalled();
    expect(mockWritable.close).toHaveBeenCalled();
    expect(component.exported.emit).toHaveBeenCalledWith({ format: "xlsx" });
    expect(component.close.emit).toHaveBeenCalled();
    expect(component.isExporting).toBeFalse();
  });

  it("should handle export error gracefully", async () => {
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("driverCount", 2);
    mockDataService.exportDrivers.and.returnValue(
      throwError(() => new Error("Network error")),
    );

    await component.onExport();

    expect(component.errorMessage).toBe("DEM_ERROR_EXPORT_FAILED");
    expect(component.isExporting).toBeFalse();
  });

  it("should not export when driverCount is 0", async () => {
    fixture.componentRef.setInput("driverCount", 0);
    await component.onExport();
    expect(mockDataService.exportDrivers).not.toHaveBeenCalled();
  });
});
