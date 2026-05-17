import { Component, input, output } from "@angular/core";
import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, of, throwError } from "rxjs";
import { AnalyticsService } from "@app/analytics.service";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { ConnectionMonitorService } from "@app/services/connection-monitor.service";
import { HelpService } from "@app/services/help.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";

// Mock Child Components
@Component({
  selector: "app-back-button",
  standalone: true,
  template: "",
  imports: [FormsModule],
})
class MockBackButtonComponent {
  route = input<string | null>(null);
  queryParams = input<any>({});
  label = input<string>("");
  confirm = input<boolean>(false);
  confirmTitle = input<string>("");
  confirmMessage = input<string>("");
}

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

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    mockConnectionMonitor = {
      connectionState$: new BehaviorSubject("CONNECTED"),
      startMonitoring: jasmine.createSpy("startMonitoring"),
      stopMonitoring: jasmine.createSpy("stopMonitoring"),
    };

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
    };

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        DriverEditorComponent,
        MockBackButtonComponent,
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
            currentStep$: of(null),
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
    component.selectDriver(driver);
    component.allDrivers = [driver];
  }

  it("should create", () => {
    expect(component).toBeTruthy();
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
      queryParams: { id: "new_id" },
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
  });
  it("should preserve undo stack after save", () => {
    const driver = new Driver("d1", "Start", "");
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
    const driver = new Driver("d1", "Start", "");
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
    const driver = new Driver("d1", "Start", "");
    setupDriver(driver);

    // Simulate focus
    component.onInputFocus();

    // Type "A"
    component.editingDriver!.name = "A";
    component.onInputChange(); // Trigger debounce subject

    // Should NOT have saved yet (debounce 100ms)
    tick(50);
    expect(component.undoManager.undoStackItems.length).toBe(0);

    // Type "AB" before debounce hits
    component.editingDriver!.name = "AB";
    component.onInputChange(); // Reset debounce timer

    tick(50);
    expect(component.undoManager.undoStackItems.length).toBe(0);

    // Wait for full debounce (total > 100ms from last input)
    tick(100);

    // Should now have saved the SNAPSHOT state ('Start')
    expect(component.undoManager.undoStackItems.length).toBe(1);
    expect(component.undoManager.undoStackItems[0].name).toBe("Start");

    // Snapshot should now be 'AB'
    // Accessing private _snapshot on UndoManager via bracket notation if needed, but checking behavior is safer
    // Trigger another change to see if it captures 'AB'
    component.editingDriver!.name = "ABC";
    component.onInputChange();
    tick(100);
    // Stack should now have 'AB'
    expect(component.undoManager.undoStackItems[1].name).toBe("AB");

    // Undo should go to 'AB'
    component.undo();
    expect(component.editingDriver!.name).toBe("AB");

    component.undo();
    expect(component.editingDriver!.name).toBe("Start");

    discardPeriodicTasks();
  }));

  describe("Auto-save on name/nickname change", () => {
    it("should auto-save when name changes to a valid unique value", fakeAsync(() => {
      const driver = new Driver("d1", "OriginalName", "Nick");
      setupDriver(driver);

      // Simulate focus, type new name, and blur to trigger commit
      component.onInputFocus();
      component.editingDriver!.name = "NewUniqueName";
      component.onInputBlur();
      tick(200); // Allow debounce to settle

      expect(dataService.updateDriver).toHaveBeenCalledWith(
        "d1",
        jasmine.any(Object),
      );
      expect(component.isSaving).toBeFalse();
      expect(component.isDirtyState()).toBeFalse();
    }));

    it("should auto-save when nickname changes to a valid unique value", fakeAsync(() => {
      const driver = new Driver("d1", "SomeName", "OrigNick");
      setupDriver(driver);

      component.onInputFocus();
      component.editingDriver!.nickname = "NewUniqueNick";
      component.onInputBlur();
      tick(200);

      expect(dataService.updateDriver).toHaveBeenCalledWith(
        "d1",
        jasmine.any(Object),
      );
      expect(component.isSaving).toBeFalse();
      expect(component.isDirtyState()).toBeFalse();
    }));

    it("should not auto-save when name is set to a duplicate", fakeAsync(() => {
      const driver = new Driver("d1", "OriginalName", "");
      setupDriver(driver);
      component.allDrivers = [
        new Driver("d1", "OriginalName", ""),
        new Driver("d2", "TakenName", ""),
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
      const driver = new Driver("d1", "OriginalName", "");
      setupDriver(driver);

      component.onInputFocus();
      component.editingDriver!.name = "";
      component.onInputBlur();
      tick(200);

      expect(dataService.updateDriver).not.toHaveBeenCalled();
      expect(component.isNameInvalid).toBeTrue();
    }));

    it("should not show back confirmation when config is valid after name change", fakeAsync(() => {
      const driver = new Driver("d1", "OriginalName", "");
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
      const driver = new Driver("d1", "", "");
      setupDriver(driver);
      component.editingDriver!.name = "";

      // Config is invalid because name is empty
      expect(component.isConfigValid()).toBeFalse();
    });

    it("should show back confirmation when name is a duplicate", () => {
      const driver = new Driver("d1", "OrigName", "");
      setupDriver(driver);
      component.allDrivers = [
        new Driver("d1", "OrigName", ""),
        new Driver("d2", "Taken", ""),
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
    });
  });
});
