import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { throwError } from "rxjs";
import { DataService } from "@app/data.service";
import { CarField } from "@app/models/car-field";
import { LoggerService } from "@app/services/logger.service";
import { TranslationService } from "@app/services/translation.service";
import { MOCK_CAR_FIELDS } from "@app/testing/data/cars_data";
import {
  mockLoggerService,
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import { createCarEditorDataServiceMock } from "../testing/car-editor_helper";
import {
  CarFieldManagerComponent,
  parseChoices,
} from "./car-field-manager.component";
import { CarFieldManagerHarness } from "./testing/car-field-manager.harness";

describe("parseChoices", () => {
  it("keeps one trimmed choice per line, without empty lines or duplicates", () => {
    expect(parseChoices(" Soft \n\nHard\r\nsoft\nMedium ")).toEqual([
      "Soft",
      "Hard",
      "Medium",
    ]);
    expect(parseChoices("")).toEqual([]);
  });
});

describe("CarFieldManagerComponent", () => {
  let fixture: ComponentFixture<CarFieldManagerComponent>;
  let component: CarFieldManagerComponent;
  let dataService: any;
  let emitted: CarField[][];
  let deleted: string[];

  const fields = () => MOCK_CAR_FIELDS.map((f) => CarField.fromJSON(f));

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);
    dataService = createCarEditorDataServiceMock();
    await TestBed.configureTestingModule({
      imports: [CarFieldManagerComponent],
      providers: [
        { provide: DataService, useValue: dataService },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: LoggerService, useValue: mockLoggerService },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CarFieldManagerComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput("visible", true);
    fixture.componentRef.setInput("fields", fields());
    emitted = [];
    deleted = [];
    component.fieldsChange.subscribe((f) => emitted.push(f));
    component.fieldDeleted.subscribe((id) => deleted.push(id));
    fixture.detectChanges();
  });

  afterEach(() => resetMocks());

  async function harness() {
    return TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      CarFieldManagerHarness,
    );
  }

  it("lists the fields in order", async () => {
    const h = await harness();
    expect(await h.getFieldNames()).toEqual([
      "Weight (g)",
      "Tyre compound",
      "Pinion",
      "Lights",
    ]);
  });

  it("moves the focus into the dialog when it opens", async () => {
    await new Promise((resolve) => setTimeout(resolve));
    expect(document.activeElement?.id).toBe("btn-new-car-field");
  });

  it("is hidden when not visible", async () => {
    fixture.componentRef.setInput("visible", false);
    fixture.detectChanges();
    expect(await (await harness()).isOpen()).toBeFalse();
  });

  it("adds a text field", async () => {
    const h = await harness();
    await h.clickNewField();
    await h.setName("  Guide ");
    await h.clickSave();
    await fixture.whenStable();

    expect(dataService.createCarField).toHaveBeenCalledWith({
      name: "Guide",
      type: "text",
      options: [],
    });
    expect(emitted.length).toBe(1);
    expect(emitted[0].map((f) => f.name)).toContain("Guide");
    expect(component.isFormOpen).toBeFalse();
  });

  it("adds a choice field with its choices", async () => {
    component.openCreateForm();
    component.formName = "Motor brand";
    component.formType = "choice";
    component.formChoices = "Slot.it\nNSR\n\nslot.it";
    await component.saveForm();

    expect(dataService.createCarField).toHaveBeenCalledWith({
      name: "Motor brand",
      type: "choice",
      options: ["Slot.it", "NSR"],
    });
  });

  it("asks for a name", async () => {
    const h = await harness();
    await h.clickNewField();
    await h.clickSave();
    expect(await h.getError()).toContain("CFM_ERROR_NAME_EMPTY");
    expect(dataService.createCarField).not.toHaveBeenCalled();
  });

  it("refuses a name another field has", async () => {
    component.openCreateForm();
    component.formName = "pinion";
    await component.saveForm();
    expect(component.formError).toBe("CFM_ERROR_NAME_EXISTS");
    expect(dataService.createCarField).not.toHaveBeenCalled();
  });

  it("asks for at least one choice", async () => {
    component.openCreateForm();
    component.formName = "Compound 2";
    component.formType = "choice";
    component.formChoices = "  \n";
    await component.saveForm();
    expect(component.formError).toBe("CFM_ERROR_CHOICES");
  });

  it("shows the server's duplicate error", async () => {
    dataService.createCarField.and.returnValue(
      throwError(() => ({ status: 409 })),
    );
    component.openCreateForm();
    component.formName = "Guide";
    await component.saveForm();
    expect(component.formError).toBe("CFM_ERROR_NAME_EXISTS");
    expect(component.isFormOpen).toBeTrue();
  });

  it("shows a general error when saving fails", async () => {
    dataService.createCarField.and.returnValue(
      throwError(() => ({ status: 500 })),
    );
    component.openCreateForm();
    component.formName = "Guide";
    await component.saveForm();
    expect(component.formError).toBe("CFM_ERROR_SAVE_FAILED");
  });

  it("edits a field, keeping its type and position", async () => {
    const compound = fields()[1];
    component.openEditForm(compound);
    expect(component.formChoices).toBe("Soft\nMedium\nHard");
    component.formName = "Compound";
    component.formChoices = "Soft\nHard";
    await component.saveForm();

    expect(dataService.updateCarField).toHaveBeenCalledWith("f-compound", {
      name: "Compound",
      type: "choice",
      options: ["Soft", "Hard"],
      position: 1,
    });
    const names = emitted[0].map((f) => f.name);
    expect(names).toEqual(["Weight (g)", "Compound", "Pinion", "Lights"]);
  });

  it("allows keeping its own name while editing", async () => {
    component.openEditForm(fields()[2]);
    expect(component.validate()).toBe("");
  });

  it("locks the type while editing", () => {
    component.openEditForm(fields()[0]);
    fixture.detectChanges();
    const select = fixture.nativeElement.querySelector(
      "#car-field-type-select",
    );
    expect(select.textContent).toContain("CFM_TYPE_NUMBER");
    expect(fixture.nativeElement.textContent).toContain("CFM_TYPE_FIXED");
  });

  it("moves a field down and saves both positions", async () => {
    const weight = fields()[0];
    expect(component.canMove(weight, -1)).toBeFalse();
    expect(component.canMove(weight, 1)).toBeTrue();
    await component.move(weight, 1);

    expect(dataService.updateCarField).toHaveBeenCalledTimes(2);
    expect(emitted[0].map((f) => f.entity_id)).toEqual([
      "f-compound",
      "f-weight",
      "f-pinion",
      "f-lights",
    ]);
    expect(emitted[0].map((f) => f.position)).toEqual([0, 1, 2, 3]);
  });

  it("does not move the last field down", async () => {
    await component.move(fields()[3], 1);
    expect(dataService.updateCarField).not.toHaveBeenCalled();
  });

  it("asks before deleting, then deletes", async () => {
    const pinion = fields()[2];
    component.confirmDelete(pinion);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector("#car-field-delete-f-pinion"),
    ).not.toBeNull();

    await component.executeDelete(pinion);

    expect(dataService.deleteCarField).toHaveBeenCalledWith("f-pinion");
    expect(deleted).toEqual(["f-pinion"]);
    expect(emitted[0].map((f) => f.entity_id)).not.toContain("f-pinion");
  });

  it("keeps the field when deleting is cancelled", () => {
    component.confirmDelete(fields()[2]);
    component.cancelDelete();
    expect(component.deletingId).toBeNull();
    expect(dataService.deleteCarField).not.toHaveBeenCalled();
  });

  it("keeps the field when the server can't delete it", async () => {
    dataService.deleteCarField.and.returnValue(throwError(() => ({})));
    await component.executeDelete(fields()[2]);
    expect(deleted).toEqual([]);
    expect(mockLoggerService.error).toHaveBeenCalled();
  });

  it("shows an empty state without fields", () => {
    fixture.componentRef.setInput("fields", []);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("CFM_EMPTY");
  });

  it("closes with Done", async () => {
    let closed = 0;
    component.close.subscribe(() => closed++);
    await (await harness()).clickDone();
    expect(closed).toBe(1);
  });

  it("uses the label of each type", () => {
    expect(component.typeLabelKey("boolean")).toBe("CFM_TYPE_BOOLEAN");
  });

  it("ignores a second save while saving", async () => {
    component.isSaving = true;
    component.formName = "Guide";
    await component.saveForm();
    expect(dataService.createCarField).not.toHaveBeenCalled();
  });
});
