import { DragDropModule } from "@angular/cdk/drag-drop";
import { Location } from "@angular/common";
import {
  Component,
  EventEmitter,
  Input,
  Output,
  Pipe,
  PipeTransform,
} from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { AnalyticsService } from "src/app/analytics.service";
import { DataService } from "src/app/data.service";
import { Driver } from "src/app/models/driver";
import { Team } from "src/app/models/team";
import { ConnectionMonitorService } from "src/app/services/connection-monitor.service";
import { HelpService } from "src/app/services/help.service";
import { SettingsService } from "src/app/services/settings.service";
import { TranslationService } from "src/app/services/translation.service";
import {
  MOCK_DRIVER_INSTANCES,
  MOCK_DRIVERS,
} from "src/app/testing/data/drivers_data";
import {
  MOCK_TEAM_INSTANCES,
  MOCK_TEAMS,
} from "src/app/testing/data/teams_data";
import {
  mockAnalyticsService,
  mockRouter,
  mockSettingsService,
  mockTranslationService,
  resetMocks,
} from "src/app/testing/unit-test-mocks";

import { createTeamManagerDataServiceMock } from "../team-manager/testing/team-manager_helper";
import { TeamEditorComponent } from "./team-editor.component";

// Mock Child Components
@Component({ selector: "app-back-button", template: "", standalone: false })
class MockBackButtonComponent {
  @Input() route: string | null = null;
  @Input() queryParams: any = {};
  @Input() label: string = "";
}

@Component({ selector: "app-image-selector", template: "", standalone: false })
class MockImageSelectorComponent {
  @Input() label?: string;
  @Input() imageUrl?: string;
  @Input() assets: any[] = [];
  @Input() size?: string;
  @Output() imageUrlChange = new EventEmitter<string>();
  @Output() uploadStarted = new EventEmitter<void>();
  @Output() uploadFinished = new EventEmitter<void>();
}

@Component({ selector: "app-item-selector", template: "", standalone: false })
class MockItemSelectorComponent {
  @Input() items: any[] = [];
  @Input() visible: boolean = false;
  @Input() backButtonRoute: string | null = null;
  @Input() backButtonQueryParams: any = {};
  @Input() title: string = "";
  @Input() itemType: string = "image";
  @Output() select = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();
}

@Component({
  selector: "app-undo-redo-controls",
  template: "",
  standalone: false,
})
class MockUndoRedoControlsComponent {
  @Input() manager: any;
}

@Component({ selector: "app-editor-title", template: "", standalone: false })
class MockEditorTitleComponent {
  @Input() titleKey: string = "";
  @Input() backRoute: string = "";
  @Input() backConfirm: boolean = false;
  @Input() backConfirmTitle: string = "";
  @Input() backConfirmMessage: string = "";
  @Input() undoManager: any;
  @Input() showUndo: boolean = true;
  @Input() showRedo: boolean = true;
  @Input() showHelp: boolean = true;
  @Input() showCopy: boolean = false;
  @Input() showAdd: boolean = false;
  @Input() showDelete: boolean = false;
  @Input() isSaving: boolean = false;
  @Input() helpSteps: any[] = [];
  @Input() helpTitle: string = "";
  @Input() helpRecordName?: string;
  @Output() help = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();
  @Output() copy = new EventEmitter<void>();
  @Output() add = new EventEmitter<void>();
  @Output() delete = new EventEmitter<void>();
}

@Component({ selector: "app-help-overlay", template: "", standalone: false })
class MockHelpOverlayComponent {}

@Pipe({ name: "translate", standalone: false })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Pipe({ name: "avatarUrl", standalone: false })
class MockAvatarUrlPipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe("TeamEditorComponent", () => {
  let component: TeamEditorComponent;
  let fixture: ComponentFixture<TeamEditorComponent>;
  let dataService: any;
  let router: any;
  let mockConnectionMonitor: any;
  let mockActivatedRoute: any;
  let activatedRoute: any;

  beforeEach(async () => {
    mockTranslationService.translate.and.callFake((key: string) => key);

    mockConnectionMonitor = {
      connectionState$: new BehaviorSubject("CONNECTED"),
      startMonitoring: jasmine.createSpy("startMonitoring"),
      stopMonitoring: jasmine.createSpy("stopMonitoring"),
    };

    mockRouter.serializeUrl.and.returnValue("mock-url");
    mockRouter.createUrlTree.and.returnValue({});

    mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: jasmine.createSpy("get").and.returnValue("new"),
        },
      },
      queryParams: of({ help: "false" }),
    };

    await TestBed.configureTestingModule({
      declarations: [
        TeamEditorComponent,
        MockBackButtonComponent,
        MockItemSelectorComponent,
        MockImageSelectorComponent,
        MockUndoRedoControlsComponent,
        MockEditorTitleComponent,
        MockHelpOverlayComponent,
        MockTranslatePipe,
        MockAvatarUrlPipe,
      ],
      imports: [FormsModule, DragDropModule],
      providers: [
        { provide: DataService, useValue: createTeamManagerDataServiceMock() },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: ConnectionMonitorService, useValue: mockConnectionMonitor },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        {
          provide: Location,
          useValue: jasmine.createSpyObj("Location", ["replaceState"]),
        },
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
    fixture = TestBed.createComponent(TeamEditorComponent);
    component = fixture.componentInstance;
    dataService = TestBed.inject(DataService);
    router = TestBed.inject(Router);
    activatedRoute = TestBed.inject(ActivatedRoute);

    // Use deep copies of mock data AND set prototypes
    component.editingTeam = JSON.parse(JSON.stringify(MOCK_TEAM_INSTANCES[0]));
    Object.setPrototypeOf(component.editingTeam, Team.prototype);
    component.allDrivers = JSON.parse(
      JSON.stringify(MOCK_DRIVER_INSTANCES),
    ).map((d: any) => {
      Object.setPrototypeOf(d, Driver.prototype);
      return d;
    });
    component.allTeams = JSON.parse(JSON.stringify(MOCK_TEAM_INSTANCES)).map(
      (t: any) => {
        Object.setPrototypeOf(t, Team.prototype);
        return t;
      },
    );

    fixture.detectChanges();
    component.isDirty = false;
    component.originalTeam = JSON.parse(JSON.stringify(component.editingTeam));
    component.undoManager.initialize(component.editingTeam!);
  });

  afterEach(() => {
    resetMocks();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with new team when "new" ID provided', () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("new");
    component.loadData();
    component.isDirty = false;
    component.undoManager.initialize(component.editingTeam!);
    expect(component.editingTeam?.entity_id).toBe("new");
    expect(component.isDirtyState()).toBeFalse();
  });

  it("should load team when valid ID is provided", () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("t1");
    component.loadData();
    expect(component.editingTeam?.entity_id).toBe("t1");
    expect(component.editingTeam?.name).toBe("Team Alpha");
    expect(component.isDirtyState()).toBeFalse();
  });

  it("should toggle driver membership", fakeAsync(() => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("t1");
    component.loadData();
    // Re-synchronize after loadData completes (mock is synchronous)
    component.isDirty = false;
    component.undoManager.initialize(component.editingTeam!);

    const driver3 = MOCK_DRIVER_INSTANCES[2]; // Charlie (not in Team Alpha)
    expect(component.isDriverInTeam(driver3)).toBeFalse();

    component.addDriver(driver3);
    flush(); // Handle auto-save trigger
    expect(component.isDriverInTeam(driver3)).toBeTrue();
    expect(component.isDirtyState()).toBeFalse(); // Instant auto-save with synchronous mocks

    component.removeDriver(driver3);
    flush(); // Handle auto-save trigger
    expect(component.isDriverInTeam(driver3)).toBeFalse();
  }));

  it("should save existing team", () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("t1");
    component.loadData();

    component.editingTeam!.name = "Updated Name";
    dataService.updateTeam.and.returnValue(of({ entity_id: "t1" }));
    dataService.getTeams.and.returnValue(
      of([new Team("t1", "Updated Name", "", [])]),
    );

    component.updateTeam();

    expect(dataService.updateTeam).toHaveBeenCalledWith(
      "t1",
      jasmine.any(Object),
    );
  });

  it("should save as new team", () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("t1");
    component.loadData();

    component.editingTeam!.name = "Team Gamma";
    dataService.createTeam.and.returnValue(of({ entity_id: "t3" }));

    component.saveAsNew();

    expect(dataService.createTeam).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(["/team-editor"], {
      queryParams: { id: "t3" },
    });
  });

  it("should support undo/redo for name changes", () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("t1");
    component.loadData();

    component.onInputFocus();
    component.editingTeam!.name = "Changed";
    component.onInputBlur();

    expect(component.editingTeam!.name).toBe("Changed");
    component.undo();
    expect(component.editingTeam!.name).toBe("Team Alpha");
    component.redo();
    expect(component.editingTeam!.name).toBe("Changed");
  });

  it("should identify name as invalid if it already exists", () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("t1");
    component.loadData();

    component.allTeams = [
      ...MOCK_TEAM_INSTANCES,
      new Team("t2", "Team Beta", "", []),
    ];

    component.editingTeam!.name = "Team Beta"; // Duplicate
    expect(component.isNameInvalid).toBeTrue();
  });

  it("should navigate back directly on back fallback if name IS invalid", () => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("t1");
    component.loadData();

    component.allTeams = [
      ...MOCK_TEAM_INSTANCES,
      new Team("t2", "Same Name", "", []),
    ];
    component.editingTeam!.name = "Same Name";
    dataService.updateTeam.calls.reset(); // Suppress any auto-save from name change
    component.onBackClicked();

    expect(dataService.updateTeam).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(["/team-manager"], {
      queryParams: { id: "t1" },
    });
  });

  it("should save and set flag onBackClicked if name IS valid", fakeAsync(() => {
    mockActivatedRoute.snapshot.queryParamMap.get.and.returnValue("t1");
    component.loadData();
    flush(); // Handle loadData subscription

    component.onInputFocus();
    component.editingTeam!.name = "Unique Cool Name";
    component.onInputBlur();
    flush();

    component.onBackClicked();
    flush(); // Handle updateTeam save subscription

    expect(dataService.updateTeam).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(["/team-manager"], {
      queryParams: { id: "t1" },
    });
  }));
});
