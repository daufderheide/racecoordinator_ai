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
import { BehaviorSubject, of, throwError } from "rxjs";
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
  showAdd = input<boolean>(false);
  showDelete = input<boolean>(false);
  isSaving = input<boolean>(false);
  helpSteps = input<any[]>([]);
  helpTitle = input<string>("");
  helpRecordName = input<string | undefined>();
  help = output<void>();
  back = output<void>();
  copy = output<void>();
  add = output<void>();
  delete = output<void>();
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
import { createDriverManagerDataServiceMock } from "../driver-manager/testing/driver-manager_helper";
import { DriverEditorComponent } from "./driver-editor.component";

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

  it("should configure editor title with driver nickname and update reactively", () => {
    const mockDriver: Driver = {
      entity_id: "d1",
      name: "John Doe",
      nickname: "Speedy",
      avatarUrl: "",
    } as any;
    setupDriver(mockDriver);
    fixture.detectChanges();

    const editorTitle = fixture.debugElement.query(
      By.directive(EditorTitleComponent),
    );
    expect(editorTitle).toBeTruthy();
    expect(editorTitle.componentInstance.titleKey()).toBe("DE_TITLE");
    expect(editorTitle.componentInstance.itemName()).toBe("Speedy");

    component.onNicknameChange("Lightning");
    fixture.detectChanges();
    expect(editorTitle.componentInstance.itemName()).toBe("Lightning");
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

  it("should throw error when no ID provided", () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue(null);
    expect(() => component.loadData()).toThrowError(
      "Driver Editor: No entity ID provided.",
    );
  });

  it('should initialize with new driver when "new" ID provided', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("new");
    component.loadData();
    expect(component.editingDriver).toBeDefined();
    expect(component.editingDriver?.entity_id).toBe("new");
    // element implicitly has 'any' type error on private access, so skipping explicit initialState check if not needed
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

    dataService.deleteDriver.and.returnValue(of({}));

    component.deleteDriver();

    expect(dataService.deleteDriver).toHaveBeenCalledWith("d1");
    expect(router.navigate).toHaveBeenCalledWith(["/driver-manager"], {
      queryParams: { id: "d1", from: null, returnUrl: null },
    });
  });

  it("should propagate 'from' and 'returnUrl' when navigating back", () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.callFake(
      (key: string) => {
        if (key === "from") return "modify-heats";
        if (key === "returnUrl") return "/default-raceday";
        if (key === "id") return "d1";
        return null;
      },
    );

    const driver = new Driver("d1", "Test", "");
    setupDriver(driver);

    component.onBack();

    expect(router.navigate).toHaveBeenCalledWith(["/driver-manager"], {
      queryParams: {
        id: "d1",
        from: "modify-heats",
        returnUrl: "/default-raceday",
      },
    });
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
  it("should preserve undo stack after save", () => {
    const driver = new Driver("d1", "Start", "StartNick");
    setupDriver(driver);

    // Make change and push to stack
    component.editingDriver!.name = "Changed";
    component.captureState(); // Capture AFTER change

    dataService.updateDriver.and.returnValue(of({ entity_id: "d1" }));

    // Save
    component.updateDriver();

    // Verify stack is preserved
    expect(component.undoManager.undoStackItems.length).toBe(1);
    expect(component.undoManager.undoStackItems[0].name).toBe("Start");

    // Verify hasChanges matches DB (Clean)
    expect(component.isDirtyState()).toBeFalse();

    // Undo
    component.undo();

    // Verify dirty after undo (because it differs from saved 'Changed' state)
    // Note: After save, resetTracking was called. Current state = Saved 'Changed'.
    // Initial State = Saved 'Changed'.
    // Stack has 'Start'.
    // Undo -> Editing Driver = 'Start'.
    // 'Start' != 'Changed' (Initial). So hasChanges() -> TRUE.
    expect(component.editingDriver!.name).toBe("Start");
  });

  it("should preserve entity_id on undo (context safety)", () => {
    const driver = new Driver("d1", "Start", "StartNick");
    setupDriver(driver);

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

  describe("Auto-save on name/nickname change", () => {
    it("should auto-save when name changes to a valid unique value", fakeAsync(() => {
      const driver = new Driver("d1", "OriginalName", "Nick");
      setupDriver(driver);

      component.onInputFocus();
      component.editingDriver!.name = "NewUniqueName";
      component.onInputBlur();
      tick(200);

      expect(dataService.updateDriver).toHaveBeenCalled();
      expect(component.editingDriver?.name).toBe("NewUniqueName");
      expect(component.isDirtyState()).toBeFalse();
    }));

    it("should auto-save when nickname changes to a valid unique value", fakeAsync(() => {
      const driver = new Driver("d1", "SomeName", "OrigNick");
      setupDriver(driver);

      component.onInputFocus();
      component.editingDriver!.nickname = "NewUniqueNick";
      component.onInputBlur();
      tick(200);

      expect(dataService.updateDriver).toHaveBeenCalled();
      expect(component.editingDriver?.nickname).toBe("NewUniqueNick");
      expect(component.isDirtyState()).toBeFalse();
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

    it("should not show back confirmation when config is valid after name change", fakeAsync(() => {
      const driver = new Driver("d1", "OriginalName", "OrigNick");
      setupDriver(driver);

      // Change name to valid unique value and allow auto-save to complete
      component.onInputFocus();
      component.editingDriver!.name = "ValidNewName";
      component.onInputBlur();
      tick(200);

      // Config is valid and dirty state should be cleared by auto-save
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
      component.onAudioTypeChange("lap", "none");
      expect(component.editingDriver!.lapAudio.type).toBe("none");
      expect(component.editingDriver!.lapAudio.url).toBeUndefined();
      expect(component.editingDriver!.lapAudio.text).toBeUndefined();

      tick(200);
      expect(dataService.updateDriver).toHaveBeenCalled();
      expect(component.isSaving).toBeFalse();
      expect(component.isDirtyState()).toBeFalse();
      expect(component.getUnsavedReasons()).not.toContain(
        "DISCARD_REASON_SAVING",
      );

      // 2. Change url
      component.onAudioTypeChange("bestLap", "preset");
      component.onAudioUrlChange("bestLap", "custom_best_lap_url");
      expect(component.editingDriver!.bestLapAudio.url).toBe(
        "custom_best_lap_url",
      );

      tick(200);
      expect(component.isSaving).toBeFalse();
      expect(component.isDirtyState()).toBeFalse();

      // 3. Change tts text
      component.onAudioTypeChange("penalty", "tts");
      component.onAudioTextChange("penalty", "Stop and Go Penalty");
      expect(component.editingDriver!.penaltyAudio.text).toBe(
        "Stop and Go Penalty",
      );

      tick(200);
      expect(component.isSaving).toBeFalse();
      expect(component.isDirtyState()).toBeFalse();

      discardPeriodicTasks();
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
      expect(steps.length).toBe(9);

      const selectors = steps.map((s) => s.selector).filter(Boolean);
      expect(selectors).toEqual([
        "#driver-avatar-section",
        "#driver-name-section",
        "#driver-name-nickname-link-section",
        "#driver-nickname-section",
        "#driver-audio-section",
        "#driver-lap-audio",
        "#driver-best-lap-audio",
        "#driver-penalty-audio",
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
});
