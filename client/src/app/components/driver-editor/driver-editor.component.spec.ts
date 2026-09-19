import { Component, input, output } from "@angular/core";
import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { By } from "@angular/platform-browser";
import { ActivatedRoute, convertToParamMap, Router } from "@angular/router";
import { BehaviorSubject, of, Subject, throwError } from "rxjs";
import { AnalyticsService } from "@app/analytics.service";
import { EditorTitleComponent } from "@app/components/shared/editor-title/editor-title.component";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { ConnectionMonitorService } from "@app/services/connection-monitor.service";
import { HelpService } from "@app/services/help.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";

@Component({
  selector: "app-audio-selector",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockAudioSelectorComponent {
  label = input<string>("");
  type = input<any>();
  typeChange = output<any>();
  url = input<any>();
  urlChange = output<any>();
  text = input<any>();
  textChange = output<any>();
  assets = input<any[]>([]);
  backButtonRoute = input<string | null>(null);
  backButtonQueryParams = input<any>({});
  context = input<any>();
}

@Component({
  selector: "app-image-selector",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockImageSelectorComponent {
  label = input<string | undefined>();
  imageUrl = input<string | undefined>();
  assets = input<any[]>([]);
  size = input<string | undefined>();
  imageUrlChange = output<string>();
  uploadStarted = output<void>();
  uploadFinished = output<void>();
}

@Component({
  selector: "app-item-selector",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockItemSelectorComponent {
  items = input<any[]>([]);
  visible = input<boolean>(false);
  select = output<any>();
  close = output<void>();
  itemType = input<string>("image");
  backButtonRoute = input<string | null>(null);
  backButtonQueryParams = input<any>({});
  title = input<string>("");
}

@Component({
  selector: "app-editor-title",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockEditorTitleComponent {
  titleKey = input<string>("");
  itemName = input<string | undefined>(undefined);
  items = input<{ id: string; name: string }[]>([]);
  selectedId = input<string | undefined>(undefined);
  isEditMode = input<boolean>(false);
  showEdit = input<boolean>(false);
  disabledEdit = input<boolean>(false);
  backRoute = input<string>("");
  backConfirm = input<boolean>(false);
  backQueryParams = input<any>({});
  backConfirmTitle = input<string>("");
  backConfirmMessage = input<string>("");
  undoManager = input<any>();
  showUndo = input<boolean>(true);
  showRedo = input<boolean>(true);
  showHelp = input<boolean>(true);
  showCopy = input<boolean>(false);
  disabledCopy = input<boolean>(false);
  copyDisabledTooltipKey = input<string>("");
  showAdd = input<boolean>(false);
  showDelete = input<boolean>(false);
  disabledDelete = input<boolean>(false);
  isSaving = input<boolean>(false);
  helpSteps = input<any[]>([]);
  helpTitle = input<string>("");
  helpRecordName = input<string | undefined>();
  help = output<void>();
  back = output<void>();
  copy = output<void>();
  add = output<void>();
  delete = output<void>();
  selectedIdChange = output<string>();
  edit = output<void>();
}

@Component({
  selector: "app-help-overlay",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockHelpOverlayComponent {
  steps = input<any[]>([]);
  showHelp = input<boolean>(false);
  helpClosed = output<void>();
}

import { Pipe, PipeTransform } from "@angular/core";
import {
  MOCK_DRIVER_INSTANCES,
  MOCK_DRIVERS as _MOCK_DRIVERS,
} from "@app/testing/data/drivers_data";
import {
  mockAnalyticsService,
  mockRouter,
  mockSettingsService,
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import { NavigationService } from "../../services/navigation.service";
import { DriverEditorComponent } from "./driver-editor.component";
import { createDriverManagerDataServiceMock } from "./testing/driver-editor_helper";

@Pipe({ name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Pipe({ name: "avatarUrl" })
class MockAvatarUrlPipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("DriverEditorComponent", () => {
  let component: DriverEditorComponent;
  let fixture: ComponentFixture<DriverEditorComponent>;
  let dataService: any;
  let router: any;
  let mockConnectionMonitor: any;
  let mockActivatedRoute: any;
  let mockHelpStepSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    mockConnectionMonitor = {
      connectionState$: new BehaviorSubject("CONNECTED"),
      startMonitoring: jasmine.createSpy("startMonitoring"),
      stopMonitoring: jasmine.createSpy("stopMonitoring"),
    };
    mockHelpStepSubject = new BehaviorSubject(null);

    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy("get").and.callFake((key: string) => {
            if (key === "id") return "new";
            return null;
          }),
        },
      },
      queryParams: of({ help: "false" }),
      queryParamMap: of(convertToParamMap({ id: "d1" })),
    };

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        DriverEditorComponent,
        MockAudioSelectorComponent,
        MockItemSelectorComponent,
        MockImageSelectorComponent,
        MockEditorTitleComponent,
        MockHelpOverlayComponent,
        MockTranslatePipe,
        MockAvatarUrlPipe,
      ],
      providers: [
        {
          provide: DataService,
          useValue: createDriverManagerDataServiceMock(),
        },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        {
          provide: HelpService,
          useValue: jasmine.createSpyObj("HelpService", ["startGuide"], {
            isVisible$: of(false),
            currentStep$: mockHelpStepSubject.asObservable(),
            hasNext$: of(false),
            hasPrevious$: of(false),
          }),
        },
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: SettingsService, useValue: mockSettingsService },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DriverEditorComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    resetMocks();
    fixture.destroy();
    try {
      discardPeriodicTasks();
    } catch (e) {
      // Not in fakeAsync zone
    }
  });

  // Helper to setup driver state for change tracking and undo/redo
  function setupDriver(driver: Driver) {
    component.isLoading = false;
    component.selectDriver(driver);
    component.allDrivers = [driver];
  }

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should configure editor title with driver selector items and selectedId", () => {
    const mockDriver: Driver = {
      entity_id: "d1",
      name: "John Doe",
      nickname: "Speedy",
      avatarUrl: "",
    } as any;
    setupDriver(mockDriver);
    component.updateDriverSelectItems();
    fixture.detectChanges();

    const editorTitle = fixture.debugElement.query(
      By.directive(EditorTitleComponent),
    );
    expect(editorTitle).toBeTruthy();
    expect(editorTitle.componentInstance.titleKey()).toBe("DE_TITLE");
    expect(editorTitle.componentInstance.selectedId()).toBe("d1");
    expect(component.driverSelectItems).toEqual([
      { id: "d1", name: "John Doe" },
    ]);
  });

  it("should have password manager ignore attributes on driver name and nickname input fields", () => {
    const nameEl = fixture.nativeElement.querySelector("#driver-name-input");
    expect(nameEl).toBeTruthy();
    expect(nameEl.getAttribute("data-dashlane-ignore")).toBe("true");
    expect(nameEl.getAttribute("data-1p-ignore")).toBe("true");
    expect(nameEl.getAttribute("data-lpignore")).toBe("true");
    expect(nameEl.getAttribute("data-bwignore")).toBe("true");
    expect(nameEl.getAttribute("data-form-type")).toBe("other");
    expect(nameEl.getAttribute("autocomplete")).toBe("off");

    const nicknameEl = fixture.nativeElement.querySelector(
      "#driver-nickname-input",
    );
    expect(nicknameEl).toBeTruthy();
    expect(nicknameEl.getAttribute("data-dashlane-ignore")).toBe("true");
    expect(nicknameEl.getAttribute("data-1p-ignore")).toBe("true");
    expect(nicknameEl.getAttribute("data-lpignore")).toBe("true");
    expect(nicknameEl.getAttribute("data-bwignore")).toBe("true");
    expect(nicknameEl.getAttribute("data-form-type")).toBe("other");
    expect(nicknameEl.getAttribute("autocomplete")).toBe("off");
  });

  it("should select first or last-edited driver when no ID provided", () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue(null);
    component.loadData();
    expect(component.editingDriver).toBeDefined();
    expect(component.isEditMode).toBeFalse();
  });

  it('should initialize with new driver when "new" ID provided', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("new");
    component.loadData();
    expect(component.editingDriver).toBeDefined();
    expect(component.editingDriver?.entity_id).toBe("d-new-id");
    // verify hasChanges is false
    expect(component.isDirtyState()).toBeFalse();
  });

  it("should load driver when valid ID is provided", () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("d1");

    component.loadData();

    expect(component.editingDriver?.entity_id).toBe("d1");
    expect(component.editingDriver?.name).toBe("Alice");
    expect(component.isDirtyState()).toBeFalse();
  });

  it("should populate soundAssets with both preset ('audio') and uploaded ('sound') assets", () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("d1");
    dataService.listAssets.and.returnValue(
      of([
        { name: "Preset Lap Beep", type: "audio", entity_id: "default_beep" },
        { name: "Custom Engine Sound", type: "audio", entity_id: "sound_1" },
        { name: "Avatar Image", type: "image", entity_id: "img_1" },
      ]),
    );

    component.loadData();

    expect(component.soundAssets.length).toBe(2);
    expect(component.soundAssets.map((a) => a.name)).toEqual([
      "Preset Lap Beep",
      "Custom Engine Sound",
    ]);
  });

  it("should save new driver", () => {
    const newDriver = { entity_id: "new_id", name: "New Driver" };
    const initial = new Driver("new", "New Driver", "");
    setupDriver(initial);

    // Simulate change
    component.editingDriver!.name = "New Driver Name";

    dataService.createDriver.and.returnValue(of(newDriver));

    component.updateDriver();

    expect(dataService.createDriver).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(["/driver-editor"], {
      queryParams: { id: "new_id", from: null, returnUrl: null },
      replaceUrl: true,
    });
  });

  it("should stay on page and keep original ID when save as new fails", () => {
    spyOn(console, "error");
    const driver = new Driver("d1", "Original", "Orig");
    setupDriver(driver);

    dataService.createDriver.and.returnValue(
      throwError(() => ({ status: 409, error: "Conflict" })),
    );
    spyOn(window, "alert");

    component.saveAsNew();

    expect(dataService.createDriver).toHaveBeenCalled();
    expect(component.editingDriver?.entity_id).toBe("d1");
    expect(component.isSaving).toBeFalse();
    expect(window.alert).toHaveBeenCalled();
  });

  it("should update existing driver", () => {
    const driver = new Driver("d1", "Updated Driver", "");
    setupDriver(driver);

    // Make a change
    component.editingDriver!.name = "Changed Name";

    dataService.updateDriver.and.returnValue(of({}));

    component.updateDriver();

    expect(dataService.updateDriver).toHaveBeenCalledWith(
      "d1",
      jasmine.any(Object),
    );
  });

  it("should delete driver and navigate back", () => {
    spyOn(window, "confirm").and.returnValue(true);
    const driver = new Driver("d1", "Driver to Delete", "");
    setupDriver(driver);
    component.allDrivers = [driver, new Driver("d2", "Next Driver", "")];

    dataService.deleteDriver.and.returnValue(of({}));

    component.deleteDriver();

    expect(dataService.deleteDriver).toHaveBeenCalledWith("d1");
    expect(component.selectedDriverId).toBe("d2");
    expect(component.editingDriver?.name).toBe("Next Driver");
  });

  it("should propagate 'returnUrl' when navigating back", () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.callFake(
      (key: string) => {
        if (key === "returnUrl") return "/default-raceday";
        return null;
      },
    );

    component.onBack();

    expect(router.navigateByUrl).toHaveBeenCalledWith("/default-raceday");
  });

  it("should propagate 'from' when navigating back without returnUrl", () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.callFake(
      (key: string) => {
        if (key === "from") return "modify-heats";
        return null;
      },
    );

    component.onBack();

    expect(router.navigate).toHaveBeenCalledWith(["/default-raceday"], {
      queryParams: { modifyHeats: "true" },
    });
  });

  it("should navigate to /raceday-setup when onBack has no query params", () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue(null);

    component.onBack();

    expect(router.navigate).toHaveBeenCalledWith(["/raceday-setup"]);
  });

  it("should set lastEditedId in NavigationService when loading driver id", () => {
    const navService = TestBed.inject(NavigationService);
    spyOn(navService, "setLastEditedId");

    mockActivatedRoute.queryParamMap = of(convertToParamMap({ id: "d2" }));
    component.ngOnInit();

    expect(navService.setLastEditedId).toHaveBeenCalledWith("driver", "d2");
  });

  it("should not delete if confirm is cancelled", () => {
    spyOn(window, "confirm").and.returnValue(false);
    const driver = new Driver("d1", "", "");
    setupDriver(driver);

    component.deleteDriver();

    expect(dataService.deleteDriver).not.toHaveBeenCalled();
  });

  // Undo/Redo Tests
  it("should track changes and support undo/redo", () => {
    const initial = new Driver("d1", "Start", "");
    setupDriver(initial);
    component.isEditMode = true;

    // 1. Capture state (simulating focus/before change)
    component.onInputFocus();

    // 2. Make change
    component.editingDriver!.name = "Change 1";

    // 3. Blur (simulating commit)
    component.onInputBlur();
    // undoStack should have 'Start'
    expect(component.undoManager.undoStackItems.length).toBe(1);
    expect(component.undoManager.undoStackItems[0].name).toBe("Start");

    // 4. Undo
    component.undo();
    expect(component.editingDriver!.name).toBe("Start");
    expect(component.undoManager.redoStackItems.length).toBe(1);
    expect(component.undoManager.redoStackItems[0].name).toBe("Change 1");

    // 5. Redo
    component.redo();
    expect(component.editingDriver!.name).toBe("Change 1");
    expect(component.undoManager.undoStackItems.length).toBe(1);
  });

  it("should validate uniqueness", () => {
    const driver = new Driver("d1", "MyName", "MyNick");
    setupDriver(driver);

    component.allDrivers = [
      ...MOCK_DRIVER_INSTANCES,
      new Driver("d1", "MyName", "MyNick"),
      new Driver("d2", "ExistingName", "ExistingNick"),
    ];

    // Valid
    expect(component.isNameUnique()).toBeTrue();

    // Duplicate Name
    component.editingDriver!.name = "ExistingName";
    expect(component.isNameUnique()).toBeFalse();

    // Duplicate Nickname
    component.editingDriver!.name = "MyName"; // Reset name
    component.editingDriver!.nickname = "ExistingNick";
    expect(component.isNicknameUnique()).toBeFalse();

    // Self is not duplicate
    component.editingDriver!.nickname = "MyNick";
    expect(component.isNicknameUnique()).toBeTrue();

    // Empty nickname is not unique
    component.editingDriver!.nickname = "";
    expect(component.isNicknameUnique()).toBeFalse();
    expect(component.isNicknameInvalid).toBeTrue();

    // Whitespace nickname is not unique
    component.editingDriver!.nickname = "   ";
    expect(component.isNicknameUnique()).toBeFalse();
    expect(component.isNicknameInvalid).toBeTrue();
  });
  it("should preserve undo stack after save but disable undo until edit mode is re-entered", () => {
    const driver = new Driver("d1", "Start", "StartNick");
    setupDriver(driver);
    component.isEditMode = true;

    // Make change and push to stack (triggers auto-save)
    component.editingDriver!.name = "Changed";
    component.captureState(); // Capture AFTER change

    // Verify stack is preserved and data is clean after auto-save
    expect(component.undoManager.undoStackItems.length).toBe(1);
    expect(component.undoManager.undoStackItems[0].name).toBe("Start");
    expect(component.isDirtyState()).toBeFalse();

    // Toggle out of edit mode to enter read-only mode
    component.onToggleEditMode();
    expect(component.isEditMode).toBeFalse();

    // In read-only mode, undo is disabled
    component.undo();
    expect(component.editingDriver!.name).toBe("Changed");

    // Re-entering edit mode enables undo with preserved stack
    component.onToggleEditMode();
    expect(component.isEditMode).toBeTrue();
    component.undo();
    expect(component.editingDriver!.name).toBe("Start");
  });

  it("should disable undo/redo and keyboard shortcuts in read-only mode, but preserve history for edit mode", () => {
    const driver = new Driver("d1", "Initial", "InitNick");
    setupDriver(driver);
    component.isEditMode = true;

    component.editingDriver!.name = "Modified";
    component.captureState();
    expect(component.undoManager.undoStackItems.length).toBe(1);

    // Enter read-only mode
    component.isEditMode = false;

    // Undo and redo should do nothing in read-only mode
    component.undo();
    expect(component.editingDriver!.name).toBe("Modified");
    expect(component.undoManager.undoStackItems.length).toBe(1);

    component.redo();
    expect(component.editingDriver!.name).toBe("Modified");

    // Keyboard event in read-only mode should do nothing
    const zEvent = new KeyboardEvent("keydown", { key: "z", ctrlKey: true });
    component.handleKeyboardEvent(zEvent);
    expect(component.editingDriver!.name).toBe("Modified");

    // Re-enter edit mode: undo is now enabled with preserved history
    component.isEditMode = true;
    component.undo();
    expect(component.editingDriver!.name).toBe("Initial");
    expect(component.undoManager.redoStackItems.length).toBe(1);
  });

  it("should preserve entity_id on undo (context safety)", () => {
    const driver = new Driver("d1", "Start", "StartNick");
    setupDriver(driver);
    component.isEditMode = true;

    // Simulate "Save as New" causing ID change to 'd2'
    component.editingDriver!.entity_id = "d2";
    component.editingDriver!.name = "New Name";

    // Snapshot was 'd1', current is now 'd2'. Capture commits 'd1'.
    component.captureState();

    // Undo
    component.undo();

    // Name should revert to 'Start'
    expect(component.editingDriver!.name).toBe("Start");

    // ID should STAY 'd2' (current context)
    expect(component.editingDriver!.entity_id).toBe("d2");
  });
  it("should debounce text input changes for undo history", fakeAsync(() => {
    const driver = new Driver("d1", "Start", "StartNick");
    setupDriver(driver);

    // Simulate focus
    component.onInputFocus();

    // Type "A"
    component.editingDriver!.name = "A";
    component.onInputChange(); // Trigger debounce subject

    // Should NOT have saved yet (debounce 100ms)
    tick(50);
    expect(component.undoManager.undoStackItems.length).toBe(0);

    // Fast-forward remainder
    tick(50);
    expect(component.undoManager.undoStackItems.length).toBe(1);
    expect(component.undoManager.undoStackItems[0].name).toBe("Start");

    // Clean up timer
    discardPeriodicTasks();
  }));

  it("should clear undo history when selecting a different driver", () => {
    const driver1 = new Driver("d1", "Driver 1", "D1Nick");
    const driver2 = new Driver("d2", "Driver 2", "D2Nick");
    setupDriver(driver1);

    component.editingDriver!.name = "Changed";
    component.captureState();
    expect(component.undoManager.undoStackItems.length).toBe(1);

    component.selectDriver(driver2);
    expect(component.undoManager.undoStackItems.length).toBe(0);
    expect(component.undoManager.redoStackItems.length).toBe(0);
  });

  describe("Edit mode and saving on name/nickname change", () => {
    it("should auto-save when name changes to a valid unique value and transition to read-only upon toggling edit mode", fakeAsync(() => {
      const driver = new Driver("d1", "OriginalName", "Nick");
      setupDriver(driver);
      component.isEditMode = true;

      component.onInputFocus();
      component.editingDriver!.name = "NewUniqueName";
      component.onInputBlur();

      expect(dataService.updateDriver).toHaveBeenCalled();
      expect(component.editingDriver?.name).toBe("NewUniqueName");
      expect(component.isDirtyState()).toBeFalse();
      expect(component.isEditMode).toBeTrue();

      component.onToggleEditMode();
      tick(200);

      expect(component.isEditMode).toBeFalse();
    }));

    it("should auto-save when nickname changes to a valid unique value and transition to read-only upon toggling edit mode", fakeAsync(() => {
      const driver = new Driver("d1", "SomeName", "OrigNick");
      setupDriver(driver);
      component.isEditMode = true;

      component.onInputFocus();
      component.editingDriver!.nickname = "NewUniqueNick";
      component.onInputBlur();

      expect(dataService.updateDriver).toHaveBeenCalled();
      expect(component.editingDriver?.nickname).toBe("NewUniqueNick");
      expect(component.isDirtyState()).toBeFalse();
      expect(component.isEditMode).toBeTrue();

      component.onToggleEditMode();
      tick(200);

      expect(component.isEditMode).toBeFalse();
    }));

    it("should not auto-save when name is set to a duplicate", fakeAsync(() => {
      const driver = new Driver("d1", "OriginalName", "OrigNick");
      setupDriver(driver);
      component.allDrivers = [
        new Driver("d1", "OriginalName", "OrigNick"),
        new Driver("d2", "TakenName", "TakenNick"),
      ];

      component.onInputFocus();
      component.editingDriver!.name = "TakenName";
      component.onInputBlur();
      tick(200);

      expect(dataService.updateDriver).not.toHaveBeenCalled();
      expect(component.isNameInvalid).toBeTrue();
    }));

    it("should not auto-save when nickname is set to a duplicate", fakeAsync(() => {
      const driver = new Driver("d1", "Name", "OrigNick");
      setupDriver(driver);
      component.allDrivers = [
        new Driver("d1", "Name", "OrigNick"),
        new Driver("d2", "Other", "TakenNick"),
      ];

      component.onInputFocus();
      component.editingDriver!.nickname = "TakenNick";
      component.onInputBlur();
      tick(200);

      expect(dataService.updateDriver).not.toHaveBeenCalled();
      expect(component.isNicknameInvalid).toBeTrue();
    }));

    it("should not auto-save when name is empty", fakeAsync(() => {
      const driver = new Driver("d1", "OriginalName", "OrigNick");
      setupDriver(driver);

      component.onInputFocus();
      component.editingDriver!.name = "";
      component.onInputBlur();
      tick(200);

      expect(dataService.updateDriver).not.toHaveBeenCalled();
      expect(component.isNameInvalid).toBeTrue();
    }));

    it("should not auto-save when nickname is empty", fakeAsync(() => {
      const driver = new Driver("d1", "OriginalName", "OrigNick");
      setupDriver(driver);

      component.onInputFocus();
      component.editingDriver!.nickname = "";
      component.onInputBlur();
      tick(200);

      expect(dataService.updateDriver).not.toHaveBeenCalled();
      expect(component.isNicknameInvalid).toBeTrue();
    }));

    it("should not auto-save when nickname is whitespace", fakeAsync(() => {
      const driver = new Driver("d1", "OriginalName", "OrigNick");
      setupDriver(driver);

      component.onInputFocus();
      component.editingDriver!.nickname = "   ";
      component.onInputBlur();
      tick(200);

      expect(dataService.updateDriver).not.toHaveBeenCalled();
      expect(component.isNicknameInvalid).toBeTrue();
    }));

    it("should clear dirty state when config is saved after name change", fakeAsync(() => {
      const driver = new Driver("d1", "OriginalName", "OrigNick");
      setupDriver(driver);
      component.isEditMode = true;

      // Change name to valid unique value and save via onToggleEditMode
      component.onInputFocus();
      component.editingDriver!.name = "ValidNewName";
      component.onInputBlur();
      component.onToggleEditMode();
      tick(200);

      // Config is valid and dirty state should be cleared
      expect(component.isConfigValid()).toBeTrue();
      expect(component.isDirtyState()).toBeFalse();
    }));

    it("should show back confirmation when name is invalid (empty)", () => {
      const driver = new Driver("d1", "", "OrigNick");
      setupDriver(driver);
      component.editingDriver!.name = "";

      // Config is invalid because name is empty
      expect(component.isConfigValid()).toBeFalse();
    });

    it("should show back confirmation when name is a duplicate", () => {
      const driver = new Driver("d1", "OrigName", "OrigNick");
      setupDriver(driver);
      component.allDrivers = [
        new Driver("d1", "OrigName", "OrigNick"),
        new Driver("d2", "Taken", "TakenNick"),
      ];

      component.editingDriver!.name = "Taken";
      expect(component.isConfigValid()).toBeFalse();
    });

    it("should show back confirmation when nickname is a duplicate", () => {
      const driver = new Driver("d1", "ValidName", "OrigNick");
      setupDriver(driver);
      component.allDrivers = [
        new Driver("d1", "ValidName", "OrigNick"),
        new Driver("d2", "Other", "TakenNick"),
      ];

      component.editingDriver!.nickname = "TakenNick";
      expect(component.isConfigValid()).toBeFalse();
      expect(component.isNicknameInvalid).toBeTrue();
    });

    it("should show back confirmation when nickname is invalid (empty)", () => {
      const driver = new Driver("d1", "ValidName", "OrigNick");
      setupDriver(driver);
      component.editingDriver!.nickname = "";

      expect(component.isConfigValid()).toBeFalse();
      expect(component.isNicknameInvalid).toBeTrue();
    });

    it("should show back confirmation when nickname is invalid (whitespace)", () => {
      const driver = new Driver("d1", "ValidName", "OrigNick");
      setupDriver(driver);
      component.editingDriver!.nickname = "   ";

      expect(component.isConfigValid()).toBeFalse();
      expect(component.isNicknameInvalid).toBeTrue();
    });

    it("should identify reasons why driver changes could not be saved", () => {
      const driver = new Driver("d1", "ValidName", "OrigNick");
      setupDriver(driver);
      component.allDrivers = [
        new Driver("d1", "ValidName", "OrigNick"),
        new Driver("d2", "ExistingName", "ExistingNick"),
      ];

      // Empty name
      component.editingDriver!.name = "";
      component.editingDriver!.nickname = "ValidNick";
      expect(component.getUnsavedReasons()).toContain(
        "DISCARD_REASON_DRIVER_NAME_EMPTY",
      );

      // Duplicate name
      component.editingDriver!.name = "ExistingName";
      expect(component.getUnsavedReasons()).toContain(
        "DISCARD_REASON_DRIVER_NAME_DUPLICATE",
      );

      // Empty nickname
      component.editingDriver!.name = "UniqueName";
      component.editingDriver!.nickname = "";
      expect(component.getUnsavedReasons()).toContain(
        "DISCARD_REASON_DRIVER_NICKNAME_EMPTY",
      );

      // Duplicate nickname
      component.editingDriver!.nickname = "ExistingNick";
      expect(component.getUnsavedReasons()).toContain(
        "DISCARD_REASON_DRIVER_NICKNAME_DUPLICATE",
      );

      // Saving in progress
      component.editingDriver!.nickname = "UniqueNick";
      component.isSaving = true;
      expect(component.getUnsavedReasons()).toContain("DISCARD_REASON_SAVING");
      component.isSaving = false;

      // Exited too quickly (dirty but valid and not saving)
      spyOn(component, "isDirtyState").and.returnValue(true);
      expect(component.getUnsavedReasons()).toContain(
        "DISCARD_REASON_EXIT_TOO_QUICKLY",
      );

      // Formatted discard message
      expect(component.discardMessage).toContain("•");
    });

    it("should properly handle onAudioTypeChange, onAudioUrlChange, and onAudioTextChange", fakeAsync(() => {
      const driver = new Driver("d1", "ValidName", "ValidNick");
      setupDriver(driver);
      dataService.updateDriver.and.callFake((id: string, d: any) =>
        of({ ...d, entity_id: id }),
      );

      // 1. Change type to none
      component.isEditMode = true;
      component.onAudioTypeChange("lap", "none");
      expect(component.editingDriver!.lapAudio.type).toBe("none");
      expect(component.editingDriver!.lapAudio.url).toBeUndefined();
      expect(component.editingDriver!.lapAudio.text).toBeUndefined();
      expect(dataService.updateDriver).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
      expect(component.isDirtyState()).toBeFalse();
      expect(component.isEditMode).toBeTrue();

      component.onToggleEditMode();
      expect(component.isEditMode).toBeFalse();
      expect(component.getUnsavedReasons()).not.toContain(
        "DISCARD_REASON_SAVING",
      );

      // 2. Change url
      component.isEditMode = true;
      dataService.updateDriver.calls.reset();
      component.onAudioTypeChange("bestLap", "preset");
      component.onAudioUrlChange("bestLap", "custom_best_lap_url");
      expect(component.editingDriver!.bestLapAudio.url).toBe(
        "custom_best_lap_url",
      );
      expect(dataService.updateDriver).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
      expect(component.isDirtyState()).toBeFalse();
      expect(component.isEditMode).toBeTrue();

      component.onToggleEditMode();
      expect(component.isEditMode).toBeFalse();

      // 3. Change tts text
      component.isEditMode = true;
      dataService.updateDriver.calls.reset();
      component.onAudioTypeChange("falseStart", "tts");
      component.onAudioTextChange("falseStart", "Stop and Go Penalty");
      expect(component.editingDriver!.penaltyAudio.text).toBe(
        "Stop and Go Penalty",
      );
      tick(150);
      expect(dataService.updateDriver).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
      expect(component.isDirtyState()).toBeFalse();
      expect(component.isEditMode).toBeTrue();

      component.onToggleEditMode();
      expect(component.isEditMode).toBeFalse();

      // 4. Change newRaceLeader and newHeatLeader audio
      component.isEditMode = true;
      dataService.updateDriver.calls.reset();
      component.onAudioTypeChange("newRaceLeader", "preset");
      component.onAudioUrlChange("newRaceLeader", "custom_race_leader_url");
      expect(component.editingDriver!.newRaceLeaderAudio.url).toBe(
        "custom_race_leader_url",
      );
      expect(dataService.updateDriver).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
      expect(component.isDirtyState()).toBeFalse();
      expect(component.isEditMode).toBeTrue();

      component.onToggleEditMode();
      expect(component.isEditMode).toBeFalse();

      component.isEditMode = true;
      dataService.updateDriver.calls.reset();
      component.onAudioTypeChange("newHeatLeader", "tts");
      component.onAudioTextChange("newHeatLeader", "New Heat Leader!");
      expect(component.editingDriver!.newHeatLeaderAudio.text).toBe(
        "New Heat Leader!",
      );
      tick(150);
      expect(dataService.updateDriver).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
      expect(component.isDirtyState()).toBeFalse();
      expect(component.isEditMode).toBeTrue();

      component.onToggleEditMode();
      expect(component.isEditMode).toBeFalse();

      // 5. Change pitIn and fuel audio
      component.isEditMode = true;
      dataService.updateDriver.calls.reset();
      component.onAudioTypeChange("pitIn", "preset");
      component.onAudioUrlChange("pitIn", "custom_pit_in_url");
      expect(component.editingDriver!.pitInAudio.url).toBe("custom_pit_in_url");
      expect(dataService.updateDriver).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
      expect(component.isDirtyState()).toBeFalse();
      expect(component.isEditMode).toBeTrue();

      component.onToggleEditMode();
      expect(component.isEditMode).toBeFalse();

      component.isEditMode = true;
      dataService.updateDriver.calls.reset();
      component.onAudioTypeChange("fuel", "audio_set");
      component.onAudioUrlChange("fuel", "custom_fuel_level_set");
      expect(component.editingDriver!.fuelAudio.url).toBe(
        "custom_fuel_level_set",
      );
      expect(dataService.updateDriver).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
      expect(component.isDirtyState()).toBeFalse();
      expect(component.isEditMode).toBeTrue();

      component.onToggleEditMode();
      expect(component.isEditMode).toBeFalse();
    }));

    it("should consider drivers equal when audio is none regardless of url, and when tts matches text", () => {
      const d1 = new Driver("d1", "Test", "TestNick");
      const d2 = new Driver("d1", "Test", "TestNick");

      // Both none but d1 has leftover url
      d1.lapAudio = { type: "none", url: "leftover_url" } as any;
      d2.lapAudio = { type: "none", url: undefined } as any;
      expect((component as any).areDriversEqual(d1, d2)).toBeTrue();

      // Both tts with same text but different leftover url
      d1.bestLapAudio = {
        type: "tts",
        text: "Nice lap!",
        url: "old_url",
      } as any;
      d2.bestLapAudio = {
        type: "tts",
        text: "Nice lap!",
        url: undefined,
      } as any;
      expect((component as any).areDriversEqual(d1, d2)).toBeTrue();

      // TTS with different text
      d2.bestLapAudio = {
        type: "tts",
        text: "Different",
        url: undefined,
      } as any;
      expect((component as any).areDriversEqual(d1, d2)).toBeFalse();

      // Preset with different url
      d1.penaltyAudio = { type: "preset", url: "url_a" } as any;
      d2.penaltyAudio = { type: "preset", url: "url_b" } as any;
      expect((component as any).areDriversEqual(d1, d2)).toBeFalse();

      // newRaceLeader difference
      d2.penaltyAudio = { type: "preset", url: "url_a" } as any;
      d1.newRaceLeaderAudio = { type: "preset", url: "leader_1" } as any;
      d2.newRaceLeaderAudio = { type: "preset", url: "leader_2" } as any;
      expect((component as any).areDriversEqual(d1, d2)).toBeFalse();

      // newHeatLeader difference
      d2.newRaceLeaderAudio = { type: "preset", url: "leader_1" } as any;
      d1.newHeatLeaderAudio = { type: "tts", text: "Leader 1" } as any;
      d2.newHeatLeaderAudio = { type: "tts", text: "Leader 2" } as any;
      expect((component as any).areDriversEqual(d1, d2)).toBeFalse();
    });

    it("should map fuelAudio with preset type to audio_set when toDriver is invoked", () => {
      const raw = {
        entity_id: "d_legacy",
        name: "Legacy Driver",
        fuelAudio: { type: "preset", url: "default_fuel_level" },
      };
      const driver = (component as any).toDriver(raw);
      expect(driver.fuelAudio.type).toBe("audio_set");
      expect(driver.fuelAudio.url).toBe("default_fuel_level");

      const rawNone = {
        entity_id: "d_none",
        name: "None Driver",
        fuelAudio: { type: "none" },
      };
      const driverNone = (component as any).toDriver(rawNone);
      expect(driverNone.fuelAudio.type).toBe("none");
    });

    it("should render audio groups and audio selectors with updated singular labels", () => {
      const driver = new Driver("d1", "TestDriver", "TestNick");
      setupDriver(driver);
      component.sectionsExpanded.audio = true;
      fixture.detectChanges();

      const personalGroup = fixture.nativeElement.querySelector(
        "#driver-personal-lap-group",
      );
      expect(personalGroup).toBeTruthy();
      const personalHeader = personalGroup.querySelector("h2");
      expect(personalHeader.textContent.trim()).toBe(
        "DE_GROUP_PERSONAL_LAP_SOUNDS",
      );

      const raceBestGroup = fixture.nativeElement.querySelector(
        "#driver-race-best-lap-group",
      );
      expect(raceBestGroup).toBeTruthy();
      const raceBestHeader = raceBestGroup.querySelector("h2");
      expect(raceBestHeader.textContent.trim()).toBe(
        "DE_GROUP_RACE_LAP_SOUNDS",
      );

      const overallBestGroup = fixture.nativeElement.querySelector(
        "#driver-overall-best-lap-group",
      );
      expect(overallBestGroup).toBeTruthy();
      const overallBestHeader = overallBestGroup.querySelector("h2");
      expect(overallBestHeader.textContent.trim()).toBe(
        "DE_GROUP_OVERALL_BEST_LAP_SOUNDS",
      );

      const eventGroup = fixture.nativeElement.querySelector(
        "#driver-event-sounds-group",
      );
      expect(eventGroup).toBeTruthy();
      const eventHeader = eventGroup.querySelector("h2");
      expect(eventHeader.textContent.trim()).toBe("DE_GROUP_EVENT_SOUNDS");

      const audioSelectors = fixture.debugElement.queryAll(
        By.css("app-audio-selector"),
      );
      expect(audioSelectors.length).toBe(12);
      expect(audioSelectors[0].componentInstance.label()).toBe(
        "DE_LABEL_LAP_SOUND",
      );
      expect(audioSelectors[1].componentInstance.label()).toBe(
        "DE_LABEL_PERSONAL_BEST_LAP_SOUND",
      );
      expect(audioSelectors[2].componentInstance.label()).toBe(
        "DE_LABEL_RACE_BEST_LAP_SOUND",
      );
      expect(audioSelectors[3].componentInstance.label()).toBe(
        "DE_LABEL_RACE_LANE_BEST_LAP_SOUND",
      );
      expect(audioSelectors[4].componentInstance.label()).toBe(
        "DE_LABEL_HEAT_BEST_LAP_SOUND",
      );
      expect(audioSelectors[5].componentInstance.label()).toBe(
        "DE_LABEL_NEW_RACE_LEADER_SOUND",
      );
      expect(audioSelectors[6].componentInstance.label()).toBe(
        "DE_LABEL_NEW_HEAT_LEADER_SOUND",
      );
      expect(audioSelectors[7].componentInstance.label()).toBe(
        "DE_LABEL_OVERALL_BEST_LAP_SOUND",
      );
      expect(audioSelectors[8].componentInstance.label()).toBe(
        "DE_LABEL_OVERALL_LANE_BEST_LAP_SOUND",
      );
      expect(audioSelectors[9].componentInstance.label()).toBe(
        "DE_LABEL_PIT_IN_SOUND",
      );
      expect(audioSelectors[10].componentInstance.label()).toBe(
        "DE_LABEL_FUEL_SOUND",
      );
      expect(audioSelectors[11].componentInstance.label()).toBe(
        "DE_LABEL_FALSE_START_SOUND",
      );
    });

    it("should toggle all sections and check expansion state", () => {
      component.toggleAllSections(false);
      expect(component.areAllSectionsExpanded()).toBeFalse();
      expect(component.sectionsExpanded.audio).toBeFalse();

      component.toggleAllSections(true);
      expect(component.areAllSectionsExpanded()).toBeTrue();
      expect(component.sectionsExpanded.audio).toBeTrue();
    });
  });

  describe("guided help", () => {
    it("should force expand audio section when step selector includes 'audio'", () => {
      component.sectionsExpanded.audio = false;

      mockHelpStepSubject.next({ selector: "#driver-audio-section" });
      fixture.detectChanges();

      expect(component.sectionsExpanded.audio).toBeTrue();
    });

    it("should not expand audio section when step selector does not include 'audio'", () => {
      component.sectionsExpanded.audio = false;

      mockHelpStepSubject.next({ selector: "#driver-name-section" });
      fixture.detectChanges();

      expect(component.sectionsExpanded.audio).toBeFalse();
    });

    it("should provide all guide steps including the name and nickname link step in correct order", () => {
      const steps = component.getHelpSteps();
      expect(steps.length).toBe(19);

      const selectors = steps.map((s) => s.selector).filter(Boolean);
      expect(selectors).toEqual([
        "#editor-object-selector",
        "#driver-avatar-section",
        "#driver-name-section",
        "#driver-name-nickname-link-section",
        "#driver-nickname-section",
        "#driver-audio-section",
        "#driver-lap-audio",
        "#driver-best-lap-audio",
        "#driver-race-best-lap-audio",
        "#driver-race-lane-best-lap-audio",
        "#driver-heat-best-lap-audio",
        "#driver-new-race-leader-audio",
        "#driver-new-heat-leader-audio",
        "#driver-overall-best-lap-audio",
        "#driver-overall-lane-best-lap-audio",
        "#driver-pit-in-audio",
        "#driver-fuel-audio",
        "#driver-false-start-audio",
      ]);

      const linkStep = steps.find(
        (s) => s.selector === "#driver-name-nickname-link-section",
      );
      expect(linkStep).toBeDefined();
      expect(linkStep?.title).toBe("DE_HELP_LINK_TITLE");
      expect(linkStep?.content).toBe("DE_HELP_LINK_CONTENT");
      expect(linkStep?.position).toBe("bottom");
    });
  });

  describe("name and nickname linking", () => {
    beforeEach(() => {
      localStorage.removeItem("driver_editor_name_nickname_linked");
    });

    afterEach(() => {
      localStorage.removeItem("driver_editor_name_nickname_linked");
    });

    it("should default isNameNicknameLinked to false if not in localStorage", () => {
      component.loadLinkState();
      expect(component.isNameNicknameLinked).toBeFalse();
    });

    it("should load isNameNicknameLinked as true if stored in localStorage", () => {
      localStorage.setItem("driver_editor_name_nickname_linked", "true");
      component.loadLinkState();
      expect(component.isNameNicknameLinked).toBeTrue();
    });

    it("should load isNameNicknameLinked as false if stored in localStorage", () => {
      localStorage.setItem("driver_editor_name_nickname_linked", "false");
      component.loadLinkState();
      expect(component.isNameNicknameLinked).toBeFalse();
    });

    it("should handle localStorage errors gracefully when loading and saving", () => {
      const loggerSpy = spyOn((component as any).logger, "error");
      spyOn(localStorage, "getItem").and.throwError("Storage error");
      component.loadLinkState();
      expect(loggerSpy).toHaveBeenCalledWith(
        "Error loading link state",
        jasmine.any(Error),
      );

      spyOn(localStorage, "setItem").and.throwError("Quota exceeded");
      component.saveLinkState();
      expect(loggerSpy).toHaveBeenCalledWith(
        "Error saving link state",
        jasmine.any(Error),
      );
    });

    it("should toggle isNameNicknameLinked and persist to localStorage", () => {
      expect(component.isNameNicknameLinked).toBeFalse();

      component.toggleNameNicknameLink();
      expect(component.isNameNicknameLinked).toBeTrue();
      expect(localStorage.getItem("driver_editor_name_nickname_linked")).toBe(
        "true",
      );

      component.toggleNameNicknameLink();
      expect(component.isNameNicknameLinked).toBeFalse();
      expect(localStorage.getItem("driver_editor_name_nickname_linked")).toBe(
        "false",
      );
    });

    it("should sync nickname to name when toggling link on if name is set and differs from nickname", () => {
      const driver = new Driver("d1", "Lewis Hamilton", "Hammer");
      setupDriver(driver);
      component.isNameNicknameLinked = false;

      component.toggleNameNicknameLink();

      expect(component.isNameNicknameLinked).toBeTrue();
      expect(component.editingDriver?.nickname).toBe("Lewis Hamilton");
      expect(component.editingDriver?.name).toBe("Lewis Hamilton");
    });

    it("should sync name to nickname when toggling link on if name is empty and nickname is set", () => {
      const driver = new Driver("d1", "", "Speedy");
      setupDriver(driver);
      component.isNameNicknameLinked = false;

      component.toggleNameNicknameLink();

      expect(component.isNameNicknameLinked).toBeTrue();
      expect(component.editingDriver?.name).toBe("Speedy");
      expect(component.editingDriver?.nickname).toBe("Speedy");
    });

    it("should not modify nickname when toggling link off", () => {
      const driver = new Driver("d1", "Lewis Hamilton", "Lewis Hamilton");
      setupDriver(driver);
      component.isNameNicknameLinked = true;

      component.toggleNameNicknameLink();

      expect(component.isNameNicknameLinked).toBeFalse();
      expect(component.editingDriver?.nickname).toBe("Lewis Hamilton");
      expect(component.editingDriver?.name).toBe("Lewis Hamilton");
    });

    it("should update nickname when name changes if linked", () => {
      const driver = new Driver("d1", "Original Name", "Original Nick");
      setupDriver(driver);
      component.isNameNicknameLinked = true;

      component.onNameChange("New Driver Name");

      expect(component.editingDriver?.name).toBe("New Driver Name");
      expect(component.editingDriver?.nickname).toBe("New Driver Name");
    });

    it("should update name when nickname changes if linked", () => {
      const driver = new Driver("d1", "Original Name", "Original Nick");
      setupDriver(driver);
      component.isNameNicknameLinked = true;

      component.onNicknameChange("New Nickname");

      expect(component.editingDriver?.nickname).toBe("New Nickname");
      expect(component.editingDriver?.name).toBe("New Nickname");
    });

    it("should not update nickname when name changes if unlinked", () => {
      const driver = new Driver("d1", "Original Name", "Original Nick");
      setupDriver(driver);
      component.isNameNicknameLinked = false;

      component.onNameChange("New Driver Name");

      expect(component.editingDriver?.name).toBe("New Driver Name");
      expect(component.editingDriver?.nickname).toBe("Original Nick");
    });

    it("should not update name when nickname changes if unlinked", () => {
      const driver = new Driver("d1", "Original Name", "Original Nick");
      setupDriver(driver);
      component.isNameNicknameLinked = false;

      component.onNicknameChange("New Nickname");

      expect(component.editingDriver?.nickname).toBe("New Nickname");
      expect(component.editingDriver?.name).toBe("Original Name");
    });

    it("should safely ignore onNameChange and onNicknameChange if editingDriver is undefined", () => {
      component.editingDriver = undefined;
      component.isNameNicknameLinked = true;

      expect(() => component.onNameChange("Test")).not.toThrow();
      expect(() => component.onNicknameChange("Test")).not.toThrow();
    });

    it("should preserve isNameNicknameLinked when selecting another driver without mutating new driver", () => {
      component.isNameNicknameLinked = true;
      const driver2 = new Driver("d2", "Max Verstappen", "Mad Max");

      component.selectDriver(driver2);

      expect(component.isNameNicknameLinked).toBeTrue();
      expect(component.editingDriver?.name).toBe("Max Verstappen");
      expect(component.editingDriver?.nickname).toBe("Mad Max");
      expect(component.isDirtyState()).toBeFalse();
    });

    it("should toggle linkage and update DOM elements when clicked", () => {
      const driver = new Driver("d1", "Driver One", "Nick One");
      setupDriver(driver);
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector(
        "#driver-link-toggle-btn",
      ) as HTMLButtonElement;
      expect(button).toBeTruthy();
      expect(button.classList.contains("linked")).toBeFalse();

      button.click();
      fixture.detectChanges();

      expect(component.isNameNicknameLinked).toBeTrue();
      expect(button.classList.contains("linked")).toBeTrue();
      expect(component.editingDriver?.nickname).toBe("Driver One");

      button.click();
      fixture.detectChanges();

      expect(component.isNameNicknameLinked).toBeFalse();
      expect(button.classList.contains("linked")).toBeFalse();
    });
  });

  describe("onAssetSelected", () => {
    it("should append newly selected audio asset to soundAssets and not duplicate", () => {
      const driver = new Driver("d1", "Test Driver", "Tester");
      setupDriver(driver);
      component.soundAssets = [
        { model: { entityId: "existing-audio" }, type: "audio" },
      ];

      const newAsset = {
        model: { entityId: "new-audio" },
        type: "audio",
        name: "Beep",
      };
      component.onAssetSelected(newAsset);

      expect(component.soundAssets.length).toBe(2);
      expect(component.soundAssets[1]).toEqual(newAsset);

      // Re-selecting same asset should not duplicate
      component.onAssetSelected(newAsset);
      expect(component.soundAssets.length).toBe(2);
    });

    it("should append newly selected image asset to avatarAssets and not duplicate", () => {
      const driver = new Driver("d1", "Test Driver", "Tester");
      setupDriver(driver);
      component.avatarAssets = [
        { model: { entityId: "existing-avatar" }, type: "image" },
      ];

      const newAsset = {
        model: { entityId: "new-avatar" },
        type: "image",
        name: "Photo",
      };
      component.onAssetSelected(newAsset);

      expect(component.avatarAssets.length).toBe(2);
      expect(component.avatarAssets[1]).toEqual(newAsset);

      // Re-selecting same asset should not duplicate
      component.onAssetSelected(newAsset);
      expect(component.avatarAssets.length).toBe(2);
    });
  });

  describe("default name auto-select and focus", () => {
    it("should set defaultDriverName and defaultDriverNickname and focus name input when isNew is true", fakeAsync(() => {
      const driver = new Driver("d1", "Driver_1", "Racer_1");
      setupDriver(driver);
      mockActivatedRoute.snapshot.queryParamMap.get.and.callFake(
        (key: string) => {
          if (key === "id") return "d1";
          if (key === "isNew") return "true";
          return null;
        },
      );
      spyOn(component, "focusNameInput").and.callThrough();

      (component as any).loadDataInternal([driver], []);
      tick(200);

      expect(component.defaultDriverName).toBe("Driver_1");
      expect(component.defaultDriverNickname).toBe("Racer_1");
      expect(component.focusNameInput).toHaveBeenCalled();
    }));

    it("should update defaultDriverName and defaultDriverNickname and focus name input on saveAsNew", fakeAsync(() => {
      const driver = new Driver("d1", "Driver_1", "Racer_1");
      setupDriver(driver);
      spyOn(component, "focusNameInput").and.callThrough();
      spyOn(component, "updateDriver").and.stub();

      component.saveAsNew();
      tick(200);

      expect(component.defaultDriverName).toBe("Driver_2");
      expect(component.defaultDriverNickname).toBe("Racer_2");
      expect(component.focusNameInput).toHaveBeenCalled();
    }));
  });

  describe("Unified Editor Mode & Selector Lifecycle", () => {
    it("should initialize in read-only mode with populated driver selector items", () => {
      mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue(null);
      const d1 = new Driver("d1", "Alice", "Ali");
      const d2 = new Driver("d2", "Bob", "Bobby");
      (component as any).loadDataInternal([d1, d2], []);

      expect(component.isEditMode).toBeFalse();
      expect(component.driverSelectItems.length).toBe(2);
      expect(component.driverSelectItems[0]).toEqual({
        id: "d1",
        name: "Alice",
      });
      expect(component.driverSelectItems[1]).toEqual({
        id: "d2",
        name: "Bob",
      });
      expect(component.selectedDriverId).toBe("d1");
      expect(component.editingDriver?.name).toBe("Alice");
    });

    it("should select another driver via onSelectDriverById without entering edit mode", () => {
      mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue(null);
      const d1 = new Driver("d1", "Alice", "Ali");
      const d2 = new Driver("d2", "Bob", "Bobby");
      (component as any).loadDataInternal([d1, d2], []);

      component.onSelectDriverById("d2");

      expect(component.isEditMode).toBeFalse();
      expect(component.selectedDriverId).toBe("d2");
      expect(component.editingDriver?.name).toBe("Bob");
    });

    it("should toggle into edit mode when onToggleEditMode is called in read-only mode", () => {
      const d1 = new Driver("d1", "Alice", "Ali");
      setupDriver(d1);
      component.isEditMode = false;

      component.onToggleEditMode();

      expect(component.isEditMode).toBeTrue();
    });

    it("should exit edit mode without updating if there are no dirty changes", () => {
      const d1 = new Driver("d1", "Alice", "Ali");
      setupDriver(d1);
      component.isEditMode = true;
      spyOn(component, "updateDriver");

      component.onToggleEditMode();

      expect(component.isEditMode).toBeFalse();
      expect(component.updateDriver).not.toHaveBeenCalled();
    });

    it("should save changes and exit edit mode when onToggleEditMode is called with valid changes", () => {
      const d1 = new Driver("d1", "Alice", "Ali");
      setupDriver(d1);
      component.isEditMode = true;
      component.editingDriver!.name = "Alice Modified";
      dataService.updateDriver.and.returnValue(of(component.editingDriver!));

      component.onToggleEditMode();

      expect(dataService.updateDriver).toHaveBeenCalled();
      expect(component.isEditMode).toBeFalse();
    });

    it("should alert and stay in edit mode when onToggleEditMode is called with invalid changes", () => {
      const d1 = new Driver("d1", "Alice", "Ali");
      setupDriver(d1);
      component.isEditMode = true;
      component.editingDriver!.name = "";
      spyOn(window, "alert");
      spyOn(component, "updateDriver");

      component.onToggleEditMode();

      expect(window.alert).toHaveBeenCalled();
      expect(component.isEditMode).toBeTrue();
      expect(component.updateDriver).not.toHaveBeenCalled();
    });

    it("should enter edit mode and create new driver when onAddNewDriver is called", () => {
      mockTranslationService.translate.and.callFake((key: string) => {
        if (key === "DM_DEFAULT_DRIVER_NAME") return "New Driver";
        if (key === "DM_DEFAULT_DRIVER_NICKNAME") return "New Driver Nickname";
        return key;
      });
      component.allDrivers = [new Driver("d1", "Alice", "Ali")];
      dataService.createDriver.and.returnValue(
        of({
          entity_id: "new-driver-id",
          name: "New Driver",
          nickname: "New Driver Nickname",
        }),
      );
      component.onAddNewDriver();

      expect(dataService.createDriver).toHaveBeenCalled();
      expect(component.isEditMode).toBeTrue();
      expect(component.editingDriver?.entity_id).toBe("new-driver-id");
      expect(component.editingDriver?.name).toBe("New Driver");
      expect(component.defaultDriverName).toBe("New Driver");
      expect(component.selectedDriverId).toBe("new-driver-id");
    });

    it("should duplicate driver via saveAsNew when onCopyDriver is called", () => {
      const d1 = new Driver("d1", "Alice", "Ali");
      setupDriver(d1);
      component.allDrivers = [d1];
      dataService.createDriver.and.returnValue(
        of({ ...d1, entity_id: "d-copied-id", name: "Alice_1" }),
      );

      component.onCopyDriver();

      expect(dataService.createDriver).toHaveBeenCalled();
      expect(component.isEditMode).toBeTrue();
      expect(component.editingDriver?.entity_id).toBe("d-copied-id");
      expect(component.editingDriver?.name).toBe("Alice_1");
      expect(component.defaultDriverName).toBe("Alice_1");
    });

    it("should revert changes back to originalDriver on onConfirmDiscard", () => {
      const d1 = new Driver("d1", "Original Alice", "Ali");
      setupDriver(d1);
      component.isEditMode = true;
      component.editingDriver!.name = "Modified Alice";
      expect(component.hasChanges()).toBeTrue();

      component.onConfirmDiscard();

      expect(component.isEditMode).toBeFalse();
      expect(component.editingDriver?.name).toBe("Original Alice");
      expect(component.hasChanges()).toBeFalse();
      expect(component.isNavigationApproved).toBeTrue();
    });

    it("should keep pending changes on onCancelDiscard", fakeAsync(() => {
      const d1 = new Driver("d1", "Original Alice", "Ali");
      setupDriver(d1);
      component.isEditMode = true;
      component.editingDriver!.name = "Modified Alice";

      let deactivateResult: boolean | undefined;
      component.confirmDiscard().then((val) => (deactivateResult = val));

      component.onCancelDiscard();
      tick();

      expect(component.isEditMode).toBeTrue();
      expect(component.editingDriver?.name).toBe("Modified Alice");
      expect(deactivateResult).toBeFalse();
    }));

    it("should auto-save on debounced input change while remaining in edit mode", fakeAsync(() => {
      const d1 = new Driver("d1", "Alice", "Ali");
      setupDriver(d1);
      component.isEditMode = true;
      dataService.updateDriver.calls.reset();

      component.onNameChange("Alice Updated");
      tick(150);

      expect(dataService.updateDriver).toHaveBeenCalled();
      expect(component.editingDriver?.name).toBe("Alice Updated");
      expect(component.isEditMode).toBeTrue();
      expect(component.isDirtyState()).toBeFalse();
    }));

    it("should transition to read-only mode after save finishes when transitionToReadOnlyOnSave was requested", fakeAsync(() => {
      const d1 = new Driver("d1", "Alice", "Ali");
      setupDriver(d1);
      component.isEditMode = true;

      const saveSubject = new Subject<any>();
      dataService.updateDriver.and.returnValue(saveSubject.asObservable());

      // Trigger auto-save
      component.onAudioTypeChange("lap", "none");
      expect(component.isSaving).toBeTrue();
      expect(component.isEditMode).toBeTrue();

      // User clicks Done Editing while save is in flight
      component.onToggleEditMode();
      expect(component.isEditMode).toBeTrue();

      // Save completes
      saveSubject.next(component.editingDriver);
      saveSubject.complete();
      tick();

      expect(component.isSaving).toBeFalse();
      expect(component.isEditMode).toBeFalse();
    }));

    it("should trigger auto-save again if concurrent edits occurred while saving", fakeAsync(() => {
      const d1 = new Driver("d1", "Alice", "Ali");
      setupDriver(d1);
      component.isEditMode = true;

      const saveSubject = new Subject<any>();
      dataService.updateDriver.and.returnValue(saveSubject.asObservable());

      // Initial auto-save triggered
      component.onAudioTypeChange("lap", "none");
      expect(component.isSaving).toBeTrue();

      // Another change occurs while save is in flight
      component.editingDriver!.name = "Alice Even Newer";
      const autoSaveSpy = spyOn<any>(
        component,
        "autoSaveDriver",
      ).and.callThrough();

      // First save completes
      saveSubject.next(component.editingDriver);
      saveSubject.complete();
      tick();

      expect(autoSaveSpy).toHaveBeenCalled();
    }));
  });

  describe("Default Driver Selection Hierarchy", () => {
    const d1 = new Driver("d1", "Alice", "Ali");
    const d2 = new Driver("d2", "Bob", "Bobby");
    let navService: NavigationService;

    beforeEach(() => {
      navService = TestBed.inject(NavigationService);
      navService.clearLastEditedId("driver");
    });

    it("should select driver specified by id when found in allDrivers", () => {
      mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("d2");
      (component as any).loadDataInternal([d1, d2], []);

      expect(component.selectedDriverId).toBe("d2");
      expect(component.editingDriver?.name).toBe("Bob");
      expect(navService.getLastEditedId("driver")).toBe("d2");
    });

    it("should fallback to last edited driver when id cannot be selected (wrong editor or non-existent)", () => {
      navService.setLastEditedId("driver", "d2");
      (component as any).initialLastEditedId = "d2";
      mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("team-99");
      (component as any).loadDataInternal([d1, d2], []);

      expect(component.selectedDriverId).toBe("d2");
      expect(component.editingDriver?.name).toBe("Bob");
      expect(navService.getLastEditedId("driver")).toBe("d2");
    });

    it("should fallback to first driver when id cannot be selected and there is no last edited driver", () => {
      navService.clearLastEditedId("driver");
      (component as any).initialLastEditedId = null;
      mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("team-99");
      (component as any).loadDataInternal([d1, d2], []);

      expect(component.selectedDriverId).toBe("d1");
      expect(component.editingDriver?.name).toBe("Alice");
      expect(navService.getLastEditedId("driver")).toBe("d1");
    });

    it("should select last edited driver when no id is provided in queryParamMap", () => {
      navService.setLastEditedId("driver", "d2");
      mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue(null);
      (component as any).loadDataInternal([d1, d2], []);

      expect(component.selectedDriverId).toBe("d2");
      expect(component.editingDriver?.name).toBe("Bob");
    });

    it("should select first driver when no id is provided and there is no last edited driver", () => {
      navService.clearLastEditedId("driver");
      mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue(null);
      (component as any).loadDataInternal([d1, d2], []);

      expect(component.selectedDriverId).toBe("d1");
      expect(component.editingDriver?.name).toBe("Alice");
    });
  });
});
