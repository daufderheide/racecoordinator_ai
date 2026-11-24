import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of, throwError } from "rxjs";
import { DataService } from "@app/data.service";
import { CarImportPreview } from "@app/models/car-import.model";
import { TranslationService } from "@app/services/translation.service";

import { CarDialogRow } from "./import-kind";
import { ImportModalComponent } from "./import-modal.component";

/** The import dialog for slotcars (#1210, step 6b). */
describe("ImportModalComponent for slotcars", () => {
  let component: ImportModalComponent;
  let fixture: ComponentFixture<ImportModalComponent>;
  let dataService: any;

  const preview = (): CarImportPreview => ({
    totalRows: 3,
    validCount: 1,
    conflictCount: 1,
    errorCount: 1,
    importedAssetNames: ["porsche.png"],
    existingCars: [{ entityId: "7", name: "Audi R8" }],
    newFields: [{ name: "Club number", type: "text", options: [] }],
    newOptions: [{ name: "Compound", type: "choice", options: ["Super soft"] }],
    rows: [
      {
        rowIndex: 1,
        rawName: "Porsche",
        resolvedName: "Porsche",
        values: {
          picture: "/assets/x_porsche.png",
          brand: "Carrera",
          carClass: "GT3",
          scale: "1/32",
        },
        customValues: { "Club number": "12" },
        status: "VALID",
        conflictType: "NONE",
      },
      {
        rowIndex: 2,
        rawName: "Audi R8",
        resolvedName: "Audi R8",
        values: { carClass: "GT3" },
        customValues: {},
        status: "CONFLICT",
        conflictType: "DUPLICATE_NAME",
        selectedResolution: "SKIP",
        existingCarId: "7",
      },
      {
        rowIndex: 3,
        rawName: "",
        resolvedName: "",
        values: {},
        customValues: {},
        status: "ERROR",
        conflictType: "NONE",
        message: "Name is required",
      },
    ],
  });

  const el = (sel: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(sel);

  beforeEach(async () => {
    dataService = jasmine.createSpyObj("DataService", [
      "validateCarImport",
      "commitCarImport",
      "downloadCarImportTemplate",
      "validateDriverImport",
      "listAssets",
    ]);
    dataService.listAssets.and.returnValue(of([]));
    dataService.validateCarImport.and.returnValue(of(preview()));
    dataService.serverUrl = "http://localhost:7070";
    const translation = jasmine.createSpyObj("TranslationService", [
      "translate",
    ]);
    translation.translate.and.callFake((key: string, params?: any) =>
      params ? `${key}:${Object.values(params).join("|")}` : key,
    );
    await TestBed.configureTestingModule({
      imports: [ImportModalComponent],
      providers: [
        { provide: DataService, useValue: dataService },
        { provide: TranslationService, useValue: translation },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ImportModalComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("kind", "cars");
    fixture.componentRef.setInput("titleKey", "CIM_TITLE");
    fixture.componentRef.setInput("visible", true);
    fixture.detectChanges();
  });

  async function toPreview() {
    component.selectedFile = new File(["Name\nPorsche"], "cars.csv");
    component.startValidation();
    fixture.detectChanges();
  }

  it("takes car files and pictures, without the audio setting", () => {
    expect(el("#import-audio-default-select")).toBeNull();
    const input = el("input[type=file]") as HTMLInputElement;
    expect(input.accept).toContain(".png");
    expect(input.accept).not.toContain(".wav");
    expect(el(".dropzone-secondary-text")?.textContent).toContain(
      "CIM_DROPZONE_HINT",
    );
  });

  it("downloads the car template", () => {
    dataService.downloadCarImportTemplate.and.returnValue(
      throwError(() => new Error("offline")),
    );
    component.downloadTemplate("xlsx");
    expect(dataService.downloadCarImportTemplate).toHaveBeenCalledWith("xlsx");
    expect(component.errorMessage).toBe("DIM_ERROR_TEMPLATE_DOWNLOAD");
  });

  it("validates with the car endpoint and shows the cars", async () => {
    await toPreview();
    expect(dataService.validateCarImport).toHaveBeenCalled();
    expect(dataService.validateDriverImport).not.toHaveBeenCalled();
    expect(component.step).toBe("preview");
    expect(el(".col-nick")).toBeNull();
    expect(el("th.col-avatar")?.textContent).toContain("CIM_COL_PICTURE");
    expect(el(".car-details")?.textContent).toContain("Carrera · GT3 · 1/32");
    const row = component.preview!.rows[0];
    expect(row.resolvedNickname).toBe("Porsche");
    expect(row.avatarUrl).toBe("/assets/x_porsche.png");
  });

  it("says which own fields and choices the import adds", async () => {
    await toPreview();
    expect(el("#import-car-new-fields")?.textContent).toContain(
      "CIM_NEW_FIELDS:Club number",
    );
    expect(el("#import-car-new-options")?.textContent).toContain(
      "Compound: Super soft",
    );
  });

  it("uses car texts for conflicts and errors", async () => {
    await toPreview();
    const [, audi, empty] = component.preview!.rows;
    expect(audi.message).toBe("CIM_CONFLICT_DUPLICATE_NAME:Audi R8");
    expect(empty.message).toBe("CIM_ERROR_NAME_REQUIRED");
    component.onRowNameChange(empty, "Porsche");
    expect(empty.status).toBe("CONFLICT");
    expect(empty.message).toBe("CIM_CONFLICT_DUPLICATE_IN_FILE:Porsche");
  });

  it("renames a copy of an existing car to a free name", async () => {
    await toPreview();
    const audi = component.preview!.rows[1];
    component.onRowResolutionChange(audi, "AUTO_RENAME");
    expect(audi.resolvedName).toBe("Audi R8 (1)");
    expect(audi.resolvedNickname).toBe("Audi R8 (1)");
  });

  it("sends the car rows and new fields back, and shows the result", async () => {
    await toPreview();
    component.preview!.rows[1].selectedResolution = "OVERWRITE";
    dataService.commitCarImport.and.returnValue(
      of({
        success: true,
        importedCount: 1,
        updatedCount: 1,
        skippedCount: 0,
        createdCarIds: ["9"],
        updatedCarIds: ["7"],
        createdFieldNames: ["Club number"],
        messages: [],
      }),
    );
    const emitted: any[] = [];
    component.imported.subscribe((r) => emitted.push(r));

    component.commitImport();
    fixture.detectChanges();

    const request = dataService.commitCarImport.calls.mostRecent().args[0];
    expect(request.rows[1].selectedResolution).toBe("OVERWRITE");
    expect(request.rows[1].existingCarId).toBe("7");
    expect(request.rows[0].customValues).toEqual({ "Club number": "12" });
    expect(request.newFields[0].name).toBe("Club number");
    expect(component.step).toBe("summary");
    expect(emitted[0].createdDriverIds).toEqual(["9"]);
    expect(emitted[0].updatedDriverIds).toEqual(["7"]);
    expect(el("#summary-fields-card")?.textContent).toContain("1");
    expect(el(".icon-import")?.textContent).toContain("directions_car");
  });

  it("shows the car error when the import fails", async () => {
    await toPreview();
    dataService.commitCarImport.and.returnValue(throwError(() => ({})));
    component.commitImport();
    expect(component.errorMessage).toBe("CIM_ERROR_COMMIT_FAILED");
  });

  it("shows a picture that wasn't found as a warning", async () => {
    const p = preview();
    p.rows[0].message = "Picture not found: images/x.png";
    dataService.validateCarImport.and.returnValue(of(p));
    await toPreview();
    const row = component.preview!.rows[0] as CarDialogRow;
    expect(row.message).toBe("CIM_PICTURE_NOT_FOUND:images/x.png");
    expect(el(".car-row-warning")?.textContent).toContain(
      "CIM_PICTURE_NOT_FOUND",
    );
  });

  it("forgets the car changes when closed", async () => {
    await toPreview();
    component.onClose();
    expect(component.carChanges).toBeNull();
    expect(component.createdFieldNames).toEqual([]);
  });
});
