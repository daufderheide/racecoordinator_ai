import { DragDropModule } from "@angular/cdk/drag-drop";
import { Location } from "@angular/common";
import { Component, input, output, Pipe, PipeTransform } from "@angular/core";
import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick as _tick,
} from "@angular/core/testing";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { DataService } from "@app/data.service";
import { Driver } from "@app/models/driver";
import { Team } from "@app/models/team";
import { AnalyticsService } from "@app/services/analytics.service";
import { ConnectionMonitorService } from "@app/services/connection-monitor.service";
import { HelpService } from "@app/services/help.service";
import { SettingsService } from "@app/services/settings.service";
import { TranslationService } from "@app/services/translation.service";
import {
  MOCK_DRIVER_INSTANCES,
  MOCK_DRIVERS as _MOCK_DRIVERS,
} from "@app/testing/data/drivers_data";
import {
  MOCK_TEAM_INSTANCES,
  MOCK_TEAMS as _MOCK_TEAMS,
} from "@app/testing/data/teams_data";
import {
  mockAnalyticsService,
  mockRouter,
  mockSettingsService,
  mockTranslationService,
  resetMocks,
} from "@app/testing/unit-test-mocks";

import { createTeamManagerDataServiceMock } from "../team-manager/testing/team-manager_helper";
import { TeamEditorComponent } from "./team-editor.component";

// Mock Child Components
@Component({
  selector: "app-back-button",
  standalone: true,
  template: "",
  imports: [FormsModule, DragDropModule],
})
class MockBackButtonComponent {
  route = input<string | null>(null);
  queryParams = input<any>({});
  label = input<string>("");
}

@Component({
  selector: "app-image-selector",
  standalone: true,
  template: "",
  imports: [FormsModule, DragDropModule],
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
  imports: [FormsModule, DragDropModule],
})
class MockItemSelectorComponent {
  items = input<any[]>([]);
  visible = input<boolean>(false);
  backButtonRoute = input<string | null>(null);
  backButtonQueryParams = input<any>({});
  title = input<string>("");
  itemType = input<string>("image");
  select = output<any>();
  close = output<void>();
}

@Component({
  selector: "app-undo-redo-controls",
  standalone: true,
  template: "",
  imports: [FormsModule, DragDropModule],
})
class MockUndoRedoControlsComponent {
  manager = input<any>();
}

@Component({
  selector: "app-editor-title",
  standalone: true,
  template: "",
  imports: [FormsModule, DragDropModule],
})
class MockEditorTitleComponent {
  titleKey = input<string>("");
  backRoute = input<string>("");
  backConfirm = input<boolean>(false);
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
  imports: [FormsModule, DragDropModule],
})
class MockHelpOverlayComponent {}

@Pipe({ standalone: true,name: "translate" })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Pipe({ standalone: true,name: "avatarUrl" })
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
  let _activatedRoute: any;

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
      imports: [
        FormsModule,
        DragDropModule,
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
    _activatedRoute = TestBed.inject(ActivatedRoute);

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
