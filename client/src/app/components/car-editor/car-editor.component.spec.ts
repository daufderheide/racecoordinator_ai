import { TestbedHarnessEnvironment } from "@angular/cdk/testing/testbed";
import { Location } from "@angular/common";
import { Component, input, output } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { ActivatedRoute, convertToParamMap, Router } from "@angular/router";
import { BehaviorSubject, of, throwError } from "rxjs";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { ImageSelectorComponent } from "@app/components/shared/image-selector/image-selector.component";
import { DataService } from "@app/data.service";
import { ConnectionMonitorService } from "@app/services/connection-monitor.service";
import { HelpService } from "@app/services/help.service";
import { LoggerService } from "@app/services/logger.service";
import { NavigationService } from "@app/services/navigation.service";
import { TranslationService } from "@app/services/translation.service";
import { GuideStepTestHelper } from "@app/testing/guide-step-test.helper";
import {
  mockLoggerService,
  mockRouter,
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import { CarEditorComponent } from "./car-editor.component";
import { CarEditorHarness } from "./testing/car-editor.harness";
import { createCarEditorDataServiceMock } from "./testing/car-editor_helper";

@Component({ selector: "app-image-selector", standalone: true, template: "" })
class MockImageSelectorComponent {
  imageUrl = input<string | undefined>();
  assets = input<any[]>([]);
  disabled = input<boolean>(false);
  title = input<string>("");
  imageUrlChange = output<string>();
}

@Component({
  selector: "app-editor-title",
  standalone: true,
  template: `
    <div id="editor-object-nav"></div>
    <div id="toolbar-container" class="toolbar-container">
      <button type="button" id="edit-track-btn">Edit</button>
    </div>
  `,
})
class MockEditorTitleComponent {
  titleKey = input<string>("");
  showPreviewBadge = input<boolean>(false);
  items = input<{ id: string; name: string }[]>([]);
  selectedId = input<string | undefined>(undefined);
  isEditMode = input<boolean>(false);
  showEdit = input<boolean>(false);
  showAdd = input<boolean>(false);
  showCopy = input<boolean>(false);
  showDelete = input<boolean>(false);
  disabledCopy = input<boolean>(false);
  disabledDelete = input<boolean>(false);
  copyDisabledTooltipKey = input<string>("");
  showHelp = input<boolean>(true);
  helpSteps = input<any[]>([]);
  helpRecordName = input<string | undefined>();
  selectorTooltipKey = input<string>("");
  isSaving = input<boolean>(false);
  undoManager = input<any>();
  selectedIdChange = output<string>();
  edit = output<void>();
  add = output<void>();
  copy = output<void>();
  delete = output<void>();
}

describe("CarEditorComponent", () => {
  let component: CarEditorComponent;
  let fixture: ComponentFixture<CarEditorComponent>;
  let dataService: any;
  let navigation: jasmine.SpyObj<NavigationService>;
  let queryId: string | null;
  let location: jasmine.SpyObj<Location>;

  async function setUp(id: string | null = "c1") {
    queryId = id;
    mockTranslationService.translate.and.callFake((key: string) => key);
    mockRouter.serializeUrl.and.returnValue("mock-url");
    mockRouter.createUrlTree.and.returnValue({});
    mockRouter.navigate.and.returnValue(Promise.resolve(true));
    (mockRouter as any).url = "/car-editor";
    dataService = createCarEditorDataServiceMock();
    navigation = jasmine.createSpyObj("NavigationService", [
      "getLastEditedId",
      "setLastEditedId",
    ]);
    navigation.getLastEditedId.and.returnValue(null);
    location = jasmine.createSpyObj("Location", ["replaceState"]);

    TestBed.overrideComponent(CarEditorComponent, {
      remove: { imports: [ImageSelectorComponent, EditorTitleComponent] },
      add: { imports: [MockImageSelectorComponent, MockEditorTitleComponent] },
    });
    await TestBed.configureTestingModule({
      imports: [CarEditorComponent],
      providers: [
        { provide: DataService, useValue: dataService },
        { provide: TranslationService, useValue: mockTranslationService },
        {
          provide: ConnectionMonitorService,
          useValue: {
            connectionState$: new BehaviorSubject("CONNECTED"),
            startMonitoring: jasmine.createSpy("startMonitoring"),
            stopMonitoring: jasmine.createSpy("stopMonitoring"),
          },
        },
        { provide: Router, useValue: mockRouter },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (k: string) => (k === "id" ? queryId : null),
              },
            },
            queryParamMap: of(convertToParamMap(id ? { id } : {})),
          },
        },
        { provide: Location, useValue: location },
        {
          provide: HelpService,
          useValue: jasmine.createSpyObj("HelpService", ["startGuide"]),
        },
        { provide: LoggerService, useValue: mockLoggerService },
        { provide: NavigationService, useValue: navigation },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CarEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  async function harness(): Promise<CarEditorHarness> {
    return TestbedHarnessEnvironment.harnessForFixture(
      fixture,
      CarEditorHarness,
    );
  }

  afterEach(() => {
    fixture?.destroy();
    resetMocks();
  });

  describe("loading", () => {
    beforeEach(async () => setUp("c1"));

    it("shows the car from ?id= read-only", async () => {
      const h = await harness();
      expect(component.selectedCarId).toBe("c1");
      expect(component.isEditMode).toBeFalse();
      expect(await h.getName()).toBe("Porsche 911 RSR #92");
      expect(await h.getBrand()).toBe("Scalextric");
      expect(await h.getCarClass()).toBe("GT3");
      expect(await h.getMotor()).toBe("Slot.it V12/4 21.5k");
      expect(await h.isModified()).toBeTrue();
      expect(await h.isNameEditable()).toBeFalse();
      expect(navigation.setLastEditedId).toHaveBeenCalledWith("car", "c1");
    });

    it("marks the editor as a preview feature", () => {
      const title = fixture.debugElement.query(
        By.directive(MockEditorTitleComponent),
      ).componentInstance as MockEditorTitleComponent;
      expect(title.showPreviewBadge()).toBeTrue();
    });

    it("lists the cars sorted by name", () => {
      expect(component.carSelectItems.map((i) => i.name)).toEqual([
        "Audi R8 LMS",
        "Ford GT40 Mk II",
        "Porsche 911 RSR #92",
      ]);
    });

    it("suggests each used class once", async () => {
      const h = await harness();
      expect(await h.getClassSuggestions()).toEqual(["Classic", "GT3"]);
    });

    it("loads image assets only", () => {
      expect(dataService.listAssets).toHaveBeenCalled();
      expect(component.imageAssets).toEqual([]);
    });
  });

  describe("choosing the first car", () => {
    it("picks the first by name without ?id= or a last edited car", async () => {
      await setUp(null);
      expect(component.selectedCarId).toBe("c3");
    });

    it("picks the last edited car without ?id=", async () => {
      queryId = null;
      await setUpWithLastEdited("c2");
      expect(component.selectedCarId).toBe("c2");
    });

    async function setUpWithLastEdited(lastId: string) {
      await setUp(null);
      navigation.getLastEditedId.and.returnValue(lastId);
      component.loadData();
      await fixture.whenStable();
    }

    it("creates a car when there are none", async () => {
      await setUp(null);
      dataService.getCars.and.returnValue(of([]));
      dataService.createCar.calls.reset();
      component.loadData();
      await fixture.whenStable();
      expect(dataService.createCar).toHaveBeenCalledTimes(1);
      const sent = dataService.createCar.calls.mostRecent().args[0];
      expect(sent.entity_id).toBe("new");
      expect(sent.name).toBe("CE_DEFAULT_CAR_NAME");
      expect(component.isEditMode).toBeTrue();
      expect(component.selectedCarId).toBe("c-new");
    });
  });

  describe("editing", () => {
    beforeEach(async () => setUp("c1"));

    it("unlocks the fields in edit mode", async () => {
      component.onToggleEditMode();
      fixture.detectChanges();
      const h = await harness();
      expect(await h.isNameEditable()).toBeTrue();
    });

    it("marks a name another car has as invalid", () => {
      component.onToggleEditMode();
      component.editingCar!.name = "audi r8 lms";
      expect(component.isNameInvalid).toBeTrue();
      expect(component.isConfigValid()).toBeFalse();
      component.editingCar!.name = "Porsche 911 RSR #93";
      expect(component.isNameInvalid).toBeFalse();
    });

    it("marks an empty name as invalid", () => {
      component.editingCar!.name = "   ";
      expect(component.isNameInvalid).toBeTrue();
    });

    it("auto-saves a typed change", fakeAsync(() => {
      component.onToggleEditMode();
      fixture.detectChanges();
      component.onInputFocus();
      component.editingCar!.tyres = "Rubber";
      component.onInputChange();
      component.onInputBlur();
      tick(2000);
      flush();
      expect(dataService.updateCar).toHaveBeenCalled();
      const [id, sent] = dataService.updateCar.calls.mostRecent().args;
      expect(id).toBe("c1");
      expect(sent.tyres).toBe("Rubber");
      expect(sent.name).toBe("Porsche 911 RSR #92");
    }));

    it("sets the scale", fakeAsync(() => {
      component.onToggleEditMode();
      component.onScaleChange("1/24");
      tick(2000);
      flush();
      expect(component.editingCar!.scale).toBe("1/24");
      expect(dataService.updateCar.calls.mostRecent().args[1].scale).toBe(
        "1/24",
      );
    }));

    it("clears the scale with Not set", () => {
      component.onScaleChange("");
      expect(component.editingCar!.scale).toBe("");
    });

    it("toggles stock / modified", fakeAsync(async () => {
      component.onToggleEditMode();
      fixture.detectChanges();
      const h = await harness();
      await h.toggleModified();
      tick(2000);
      flush();
      expect(component.editingCar!.modified).toBeFalse();
      expect(dataService.updateCar.calls.mostRecent().args[1].modified).toBe(
        false,
      );
    }));

    it("undoes a change", () => {
      component.onToggleEditMode();
      component.onInputFocus();
      component.editingCar!.notes = "Changed";
      component.onInputChange();
      component.onInputBlur();
      component.undo();
      expect(component.editingCar!.notes).toBe(
        "Lowered body, weight in the nose.",
      );
    });

    it("leaves edit mode without saving when nothing changed", () => {
      component.onToggleEditMode();
      component.onToggleEditMode();
      expect(component.isEditMode).toBeFalse();
      expect(dataService.updateCar).not.toHaveBeenCalled();
    });

    it("does not switch cars while editing", () => {
      component.onToggleEditMode();
      component.onSelectCarById("c2");
      expect(component.selectedCarId).toBe("c1");
    });

    it("switches cars in read-only mode", () => {
      component.onSelectCarById("c2");
      expect(component.selectedCarId).toBe("c2");
      expect(component.editingCar!.name).toBe("Ford GT40 Mk II");
      expect(navigation.setLastEditedId).toHaveBeenCalledWith("car", "c2");
    });
  });

  describe("saving", () => {
    beforeEach(async () => setUp("c1"));

    it("shows the name error on a 409", () => {
      spyOn(window, "alert");
      dataService.updateCar.and.returnValue(
        throwError(() => ({ status: 409 })),
      );
      component.isEditMode = true;
      component.editingCar!.brand = "Changed";
      component.updateCar(false, false).catch(() => undefined);
      expect(window.alert).toHaveBeenCalledWith("CE_ERROR_NAME_EXISTS");
      expect(component.isSaving).toBeFalse();
    });

    it("does not alert on a failed auto-save", () => {
      spyOn(window, "alert");
      dataService.updateCar.and.returnValue(
        throwError(() => ({ status: 500 })),
      );
      component.editingCar!.brand = "Changed";
      component.updateCar(false, true).catch(() => undefined);
      expect(window.alert).not.toHaveBeenCalled();
      expect(mockLoggerService.error).toHaveBeenCalled();
    });

    it("returns to read-only after a manual save", async () => {
      component.isEditMode = true;
      component.editingCar!.brand = "Changed";
      await component.updateCar(false, false);
      expect(component.isEditMode).toBeFalse();
      expect(component.isDirtyState()).toBeFalse();
      expect(dataService.getCars).toHaveBeenCalledTimes(2);
    });
  });

  describe("add, copy and delete", () => {
    beforeEach(async () => setUp("c1"));

    it("adds a car with a free default name", () => {
      dataService.getCars.and.returnValue(of([]));
      component.onAddNewCar();
      const sent = dataService.createCar.calls.mostRecent().args[0];
      expect(sent.name).toBe("CE_DEFAULT_CAR_NAME");
      expect(component.isEditMode).toBeTrue();
      expect(component.selectedCarId).toBe("c-new");
    });

    it("copies the car with every field and a new name", async () => {
      component.onCopyCar();
      await fixture.whenStable();
      const sent = dataService.createCar.calls.mostRecent().args[0];
      expect(sent.entity_id).toBe("new");
      expect(sent.name).toBe("Porsche 911 RSR #92_1");
      expect(sent.carClass).toBe("GT3");
      expect(sent.tyres).toBe("Ortmann urethane");
      expect(sent.modified).toBeTrue();
      expect(location.replaceState).not.toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/car-editor"], {
        queryParams: { id: "c-new", returnUrl: null },
        replaceUrl: true,
      });
    });

    it("does not copy an invalid car", () => {
      component.editingCar!.name = "";
      component.onCopyCar();
      expect(dataService.createCar).not.toHaveBeenCalled();
    });

    it("asks before deleting", () => {
      component.onDeleteCar();
      expect(component.showDeleteConfirm).toBeTrue();
      component.onCancelDelete();
      expect(component.showDeleteConfirm).toBeFalse();
      expect(dataService.deleteCar).not.toHaveBeenCalled();
    });

    it("deletes and selects the next car", () => {
      component.onDeleteCar();
      component.onConfirmDelete();
      expect(dataService.deleteCar).toHaveBeenCalledWith("c1");
      expect(component.allCars.map((c) => c.entity_id)).not.toContain("c1");
      expect(component.selectedCarId).not.toBe("c1");
      expect(component.selectedCarId).toBeTruthy();
    });

    it("creates a new car after deleting the last one", () => {
      component.allCars = [
        component.allCars.find((c) => c.entity_id === "c1")!,
      ];
      dataService.createCar.calls.reset();
      component.onDeleteCar();
      component.onConfirmDelete();
      expect(dataService.createCar).toHaveBeenCalledTimes(1);
    });
  });

  describe("leaving", () => {
    beforeEach(async () => setUp("c1"));

    it("goes back to Race Day Setup", () => {
      component.onBackClicked();
      expect(mockRouter.navigate).toHaveBeenCalledWith(["/raceday-setup"]);
    });

    it("reports a duplicate name as the reason not to leave", () => {
      component.editingCar!.name = "Audi R8 LMS";
      expect(component.getUnsavedReasons()).toEqual([
        "DISCARD_REASON_CAR_NAME_DUPLICATE",
      ]);
    });

    it("restores the saved car when changes are discarded", () => {
      component.isEditMode = true;
      component.editingCar!.notes = "Changed";
      component.showDiscardConfirm = true;
      component.onConfirmDiscard();
      expect(component.showDiscardConfirm).toBeFalse();
      expect(component.isNavigationApproved).toBeTrue();
      expect(component.editingCar!.notes).toBe(
        "Lowered body, weight in the nose.",
      );
      expect(component.isEditMode).toBeFalse();
    });

    it("stops monitoring on destroy", () => {
      const monitor = TestBed.inject(ConnectionMonitorService) as any;
      fixture.destroy();
      expect(monitor.stopMonitoring).toHaveBeenCalled();
    });
  });

  describe("your fields", () => {
    beforeEach(async () => setUp("c1"));

    it("loads the fields in order", () => {
      expect(dataService.getCarFields).toHaveBeenCalled();
      expect(component.carFields.map((f) => f.name)).toEqual([
        "Weight (g)",
        "Tyre compound",
        "Pinion",
        "Lights",
      ]);
    });

    it("shows the car's values", () => {
      const [weight, compound, pinion, lights] = component.carFields;
      expect(component.customValue(weight)).toBe("82");
      expect(component.customValue(compound)).toBe("Soft");
      expect(component.customValue(pinion)).toBe("");
      expect(component.isChecked(lights)).toBeTrue();
      const input = fixture.nativeElement.querySelector(
        "#car-custom-f-weight",
      ) as HTMLInputElement;
      expect(input.type).toBe("number");
      expect(input.disabled).toBeTrue();
    });

    it("takes the focus off the car's fields when the field manager opens", async () => {
      component.onToggleEditMode();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const name = fixture.nativeElement.querySelector(
        "#car-name-input",
      ) as HTMLInputElement;
      name.focus();
      expect(document.activeElement).toBe(name);
      component.openFieldManager();
      expect(document.activeElement).not.toBe(name);
    });

    it("shows Manage fields only in edit mode", () => {
      expect(
        fixture.nativeElement.querySelector("#car-manage-fields-btn"),
      ).toBeNull();
      component.onToggleEditMode();
      fixture.detectChanges();
      fixture.nativeElement.querySelector("#car-manage-fields-btn").click();
      expect(component.isFieldManagerOpen).toBeTrue();
      component.closeFieldManager();
      expect(component.isFieldManagerOpen).toBeFalse();
    });

    it("saves a typed value as part of the car", fakeAsync(() => {
      component.onToggleEditMode();
      const pinion = component.carFields[2];
      component.onInputFocus();
      component.onCustomInput(pinion, "9");
      component.onInputBlur();
      tick(2000);
      flush();
      const sent = dataService.updateCar.calls.mostRecent().args[1];
      expect(sent.customValues["f-pinion"]).toBe("9");
      expect(sent.customValues["f-weight"]).toBe("82");
    }));

    it("removes a cleared value", fakeAsync(() => {
      component.onToggleEditMode();
      component.onInputFocus();
      component.onCustomInput(component.carFields[0], null);
      component.onInputBlur();
      tick(2000);
      flush();
      const sent = dataService.updateCar.calls.mostRecent().args[1];
      expect("f-weight" in sent.customValues).toBeFalse();
    }));

    it("saves a picked choice and a yes/no as their own undo steps", fakeAsync(() => {
      component.onToggleEditMode();
      const [, compound, , lights] = component.carFields;
      component.onCustomPick(compound, "Hard");
      component.onCustomPick(lights, false);
      tick(2000);
      flush();
      expect(component.editingCar!.customValues["f-compound"]).toBe("Hard");
      expect("f-lights" in component.editingCar!.customValues).toBeFalse();
      component.undo();
      expect(component.isChecked(lights)).toBeTrue();
    }));

    it("offers an old choice that is no longer in the list", () => {
      component.editingCar!.customValues = { "f-compound": "Wet" };
      expect(component.choicesFor(component.carFields[1])).toEqual([
        "Soft",
        "Medium",
        "Hard",
        "Wet",
      ]);
    });

    it("keeps the new order from the field manager", () => {
      const reversed = [...component.carFields].reverse().map((f, i) =>
        Object.assign(Object.create(Object.getPrototypeOf(f)), f, {
          position: i,
        }),
      );
      component.onFieldsChange(reversed);
      expect(component.carFields[0].name).toBe("Lights");
    });

    it("drops a deleted field's values without counting it as an edit", () => {
      component.onFieldDeleted("f-weight");
      expect("f-weight" in component.editingCar!.customValues).toBeFalse();
      expect("f-weight" in component.originalCar!.customValues).toBeFalse();
      expect(
        component.allCars.some((c) => "f-weight" in c.customValues),
      ).toBeFalse();
      expect(component.isDirtyState()).toBeFalse();
      expect(component.editingCar!.customValues["f-compound"]).toBe("Soft");
    });

    it("keeps other unsaved edits when a field is deleted", () => {
      component.onToggleEditMode();
      component.editingCar!.brand = "Changed";
      component.onFieldDeleted("f-weight");
      expect(component.editingCar!.brand).toBe("Changed");
      expect(component.isDirtyState()).toBeTrue();
    });

    it("copies the values when a car is duplicated", async () => {
      component.onCopyCar();
      await fixture.whenStable();
      const sent = dataService.createCar.calls.mostRecent().args[0];
      expect(sent.customValues).toEqual({
        "f-weight": "82",
        "f-compound": "Soft",
        "f-lights": "true",
      });
    });

    it("shows a hint when there are no fields", async () => {
      component.carFields = [];
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector("#car-custom-empty").textContent,
      ).toContain("CE_CUSTOM_EMPTY");
    });
  });

  describe("help", () => {
    beforeEach(async () => setUp("c1"));

    it("has help steps that point at real elements", () => {
      GuideStepTestHelper.verifyGuideStepsExistInDom(
        fixture,
        component.getHelpSteps(),
      );
    });

    it("starts the guide", () => {
      const help = TestBed.inject(HelpService) as any;
      component.startHelp();
      expect(help.startGuide).toHaveBeenCalledWith(component.getHelpSteps());
    });
  });
});
